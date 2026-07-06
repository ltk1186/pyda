import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  kakaoOAuthNextCookieName,
  kakaoOAuthNonceCookieName,
  kakaoOAuthStateCookieName,
} from "@/lib/auth/kakao";
import { GET } from "./route";

describe("/auth/kakao/callback", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("handles Kakao errors without exposing raw error details", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const response = await GET(
      requestWithCookies(
        "http://localhost:3000/auth/kakao/callback?code=secret-code&state=secret-state&error=access_denied&error_description=raw-description",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fclaim%2Fresume&error=kakao",
    );
    expect(response.headers.get("location")).not.toContain("access_denied");
    expect(response.headers.get("location")).not.toContain("raw-description");

    const logged = JSON.stringify(warnSpy.mock.calls);
    expect(logged).toContain("kakao_callback_invalid_request");
    expect(logged).not.toContain("secret-code");
    expect(logged).not.toContain("secret-state");
    expect(logged).not.toContain("secret-nonce");
    expect(logged).not.toContain("raw-description");
  });

  it("rejects missing code", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const response = await GET(
      requestWithCookies("http://localhost:3000/auth/kakao/callback?state=state"),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fclaim%2Fresume&error=kakao",
    );
  });

  it("rejects state mismatch and clears intent cookies", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const response = await GET(
      requestWithCookies(
        "http://localhost:3000/auth/kakao/callback?code=code&state=other",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fclaim%2Fresume&error=kakao",
    );
    expect(response.cookies.get(kakaoOAuthStateCookieName)?.value).toBe("");
    expect(response.cookies.get(kakaoOAuthNonceCookieName)?.value).toBe("");
    expect(response.cookies.get(kakaoOAuthNextCookieName)?.value).toBe("");
  });

  it("logs token exchange failure reason without sensitive values", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "secret-rest-key");
    vi.stubEnv("KAKAO_CLIENT_SECRET", "secret-client-secret");
    vi.stubEnv("APP_BASE_URL", "http://localhost:3000");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      }),
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const response = await GET(
      requestWithCookies(
        "http://localhost:3000/auth/kakao/callback?code=secret-code&state=state",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fclaim%2Fresume&error=kakao",
    );

    const logged = JSON.stringify(warnSpy.mock.calls);
    expect(logged).toContain("kakao_token_exchange_failed");
    expect(logged).toContain("http");
    expect(logged).toContain("401");
    expect(logged).not.toContain("secret-code");
    expect(logged).not.toContain("secret-rest-key");
    expect(logged).not.toContain("secret-client-secret");
    expect(logged).not.toContain("secret-nonce");
  });
});

function requestWithCookies(url: string) {
  return new NextRequest(url, {
    headers: {
      cookie: [
        `${kakaoOAuthStateCookieName}=state`,
        `${kakaoOAuthNonceCookieName}=secret-nonce`,
        `${kakaoOAuthNextCookieName}=/claim/resume`,
      ].join("; "),
    },
  });
}
