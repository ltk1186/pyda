import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  buildKakaoAuthorizeUrl,
  buildKakaoCallbackUrl,
  buildKakaoIdTokenCredentials,
  exchangeKakaoAuthorizationCode,
  generateKakaoOAuthToken,
  isValidKakaoCallbackState,
  kakaoOAuthCookieOptions,
  kakaoOAuthScope,
  readKakaoOAuthConfig,
  signInWithKakaoIdToken,
} from "./kakao";

const config = {
  restApiKey: "rest-key",
  clientSecret: "client-secret",
  appBaseUrl: "http://localhost:3000",
  callbackUrl: "http://localhost:3000/auth/kakao/callback",
};

describe("Kakao OIDC config", () => {
  it("requires the REST API key", () => {
    expect(() =>
      readKakaoOAuthConfig({
        KAKAO_CLIENT_SECRET: "secret",
        APP_BASE_URL: "http://localhost:3000",
      }),
    ).toThrow("Missing KAKAO_REST_API_KEY.");
  });

  it("requires the client secret", () => {
    expect(() =>
      readKakaoOAuthConfig({
        KAKAO_REST_API_KEY: "key",
        APP_BASE_URL: "http://localhost:3000",
      }),
    ).toThrow("Missing KAKAO_CLIENT_SECRET.");
  });

  it("rejects an invalid APP_BASE_URL", () => {
    expect(() =>
      readKakaoOAuthConfig({
        KAKAO_REST_API_KEY: "key",
        KAKAO_CLIENT_SECRET: "secret",
        APP_BASE_URL: "not-url",
      }),
    ).toThrow("Invalid APP_BASE_URL.");
  });

  it("builds the callback URI from APP_BASE_URL", () => {
    expect(buildKakaoCallbackUrl("http://localhost:3000")).toBe(
      "http://localhost:3000/auth/kakao/callback",
    );
    expect(
      readKakaoOAuthConfig({
        KAKAO_REST_API_KEY: "key",
        KAKAO_CLIENT_SECRET: "secret",
        APP_BASE_URL: "http://localhost:3000/",
      }).callbackUrl,
    ).toBe("http://localhost:3000/auth/kakao/callback");
  });
});

describe("Kakao OAuth start", () => {
  it("generates state and nonce with sufficient entropy", () => {
    expect(generateKakaoOAuthToken()).toHaveLength(43);
    expect(generateKakaoOAuthToken()).not.toBe(generateKakaoOAuthToken());
  });

  it("uses short-lived HttpOnly SameSite=Lax cookies", () => {
    expect(kakaoOAuthCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
  });

  it("builds an authorization URL without account_email", () => {
    const url = buildKakaoAuthorizeUrl({
      config,
      state: "state",
      nonce: "nonce",
    });

    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("rest-key");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/auth/kakao/callback",
    );
    expect(url.searchParams.get("state")).toBe("state");
    expect(url.searchParams.get("nonce")).toBe("nonce");
    expect(url.searchParams.get("scope")).toBe(kakaoOAuthScope);
    expect(url.search).toContain("openid");
    expect(url.search).toContain("profile_nickname");
    expect(url.search).toContain("profile_image");
    expect(url.search).not.toContain("account_email");
  });
});

describe("Kakao callback", () => {
  it("rejects state mismatch", () => {
    expect(
      isValidKakaoCallbackState({
        storedState: "stored",
        callbackState: "other",
      }),
    ).toBe(false);
  });

  it("builds a Kakao id token sign-in payload with nonce", () => {
    expect(
      buildKakaoIdTokenCredentials({
        idToken: "id-token",
        nonce: "nonce",
      }),
    ).toEqual({
      provider: "kakao",
      token: "id-token",
      nonce: "nonce",
    });
  });

  it("calls signInWithIdToken after a successful token exchange", async () => {
    const auth = {
      signInWithIdToken: vi.fn().mockResolvedValue({ error: null }),
    };

    await expect(
      signInWithKakaoIdToken(auth, {
        idToken: "id-token",
        nonce: "nonce",
      }),
    ).resolves.toEqual({ error: null });

    expect(auth.signInWithIdToken).toHaveBeenCalledWith({
      provider: "kakao",
      token: "id-token",
      nonce: "nonce",
    });
  });
});

describe("Kakao token exchange", () => {
  it("returns error for token HTTP errors", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn(),
    });

    await expect(
      exchangeKakaoAuthorizationCode({ code: "code", config, fetchImpl }),
    ).resolves.toEqual({ status: "error" });
  });

  it("returns error when id_token is missing", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ access_token: "access-token" }),
    });

    await expect(
      exchangeKakaoAuthorizationCode({ code: "code", config, fetchImpl }),
    ).resolves.toEqual({ status: "error" });
  });

  it("returns id_token and posts the required form fields", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id_token: "id-token" }),
    });

    await expect(
      exchangeKakaoAuthorizationCode({ code: "code", config, fetchImpl }),
    ).resolves.toEqual({ status: "success", idToken: "id-token" });

    const [, init] = fetchImpl.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "content-type": "application/x-www-form-urlencoded",
    });
    expect(init.body.get("grant_type")).toBe("authorization_code");
    expect(init.body.get("client_id")).toBe("rest-key");
    expect(init.body.get("redirect_uri")).toBe(
      "http://localhost:3000/auth/kakao/callback",
    );
    expect(init.body.get("code")).toBe("code");
    expect(init.body.get("client_secret")).toBe("client-secret");
  });
});

describe("Kakao auth source security", () => {
  it("does not expose the Kakao client secret in the Client Component", () => {
    const buttonSource = readFileSync(
      join(process.cwd(), "src/components/auth/kakao-login-button.tsx"),
      "utf8",
    );

    expect(buttonSource).not.toContain("KAKAO_CLIENT_SECRET");
    expect(buttonSource).not.toContain("KAKAO_REST_API_KEY");
    expect(buttonSource).not.toContain("signInWithOAuth");
  });

  it("does not request account_email in the Kakao auth helper", () => {
    const helperSource = readFileSync(
      join(process.cwd(), "src/lib/auth/kakao.ts"),
      "utf8",
    );

    expect(helperSource).not.toContain("account_email");
  });
});
