import { randomBytes } from "node:crypto";

export const kakaoOAuthStateCookieName = "pyda_kakao_oauth_state";
export const kakaoOAuthNonceCookieName = "pyda_kakao_oauth_nonce";
export const kakaoOAuthNextCookieName = "pyda_kakao_oauth_next";
export const kakaoOAuthMaxAgeSeconds = 10 * 60;
export const kakaoAuthorizeEndpoint = "https://kauth.kakao.com/oauth/authorize";
export const kakaoTokenEndpoint = "https://kauth.kakao.com/oauth/token";
export const kakaoOAuthScope = "openid,profile_nickname,profile_image";

const randomTokenBytes = 32;
const kakaoCallbackPath = "/auth/kakao/callback";

type KakaoOAuthEnv = {
  KAKAO_REST_API_KEY?: string;
  KAKAO_CLIENT_SECRET?: string;
  APP_BASE_URL?: string;
};

export type KakaoOAuthConfig = {
  restApiKey: string;
  clientSecret: string;
  appBaseUrl: string;
  callbackUrl: string;
};

export type KakaoTokenExchangeResult =
  | {
      status: "success";
      idToken: string;
    }
  | {
      status: "error";
      reason: "http";
      httpStatus: number;
    }
  | {
      status: "error";
      reason: "invalid_json" | "missing_id_token" | "network" | "timeout";
    };

type KakaoTokenExchangeInput = {
  code: string;
  config: KakaoOAuthConfig;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

type KakaoSignInAuth = {
  signInWithIdToken(credentials: {
    provider: "kakao";
    token: string;
    nonce: string;
  }): Promise<{ error: unknown }>;
};

export type SupabaseAuthErrorDiagnostic = {
  code: string | null;
  category: "auth_error" | "unknown_error";
};

export function readKakaoOAuthConfig(
  env: KakaoOAuthEnv = process.env as Record<string, string | undefined>,
): KakaoOAuthConfig {
  const restApiKey = env.KAKAO_REST_API_KEY?.trim();
  const clientSecret = env.KAKAO_CLIENT_SECRET?.trim();
  const appBaseUrl = normalizeAppBaseUrl(env.APP_BASE_URL);

  if (!restApiKey) {
    throw new Error("Missing KAKAO_REST_API_KEY.");
  }

  if (!clientSecret) {
    throw new Error("Missing KAKAO_CLIENT_SECRET.");
  }

  if (!appBaseUrl) {
    throw new Error("Invalid APP_BASE_URL.");
  }

  return {
    restApiKey,
    clientSecret,
    appBaseUrl,
    callbackUrl: buildKakaoCallbackUrl(appBaseUrl),
  };
}

export function normalizeAppBaseUrl(value: string | undefined | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.origin + parsed.pathname.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export function buildKakaoCallbackUrl(appBaseUrl: string) {
  return `${appBaseUrl}${kakaoCallbackPath}`;
}

export function generateKakaoOAuthToken() {
  return randomBytes(randomTokenBytes).toString("base64url");
}

export function kakaoOAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: kakaoOAuthMaxAgeSeconds,
  };
}

export function kakaoOAuthClearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

export function buildKakaoAuthorizeUrl(input: {
  config: KakaoOAuthConfig;
  state: string;
  nonce: string;
}) {
  const url = new URL(kakaoAuthorizeEndpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", input.config.restApiKey);
  url.searchParams.set("redirect_uri", input.config.callbackUrl);
  url.searchParams.set("state", input.state);
  url.searchParams.set("nonce", input.nonce);
  url.searchParams.set("scope", kakaoOAuthScope);
  return url;
}

export function buildKakaoStartPath(nextPath: string) {
  const url = new URL("/auth/kakao/start", "https://pyda.local");
  url.searchParams.set("next", nextPath);
  return `${url.pathname}${url.search}`;
}

export function isValidKakaoCallbackState(input: {
  storedState: string | null;
  callbackState: string | null;
}) {
  return Boolean(
    input.storedState &&
      input.callbackState &&
      input.storedState === input.callbackState,
  );
}

export function buildKakaoIdTokenCredentials(input: {
  idToken: string;
  nonce: string;
}) {
  return {
    provider: "kakao" as const,
    token: input.idToken,
    nonce: input.nonce,
  };
}

export async function signInWithKakaoIdToken(
  auth: KakaoSignInAuth,
  input: {
    idToken: string;
    nonce: string;
  },
) {
  return auth.signInWithIdToken(buildKakaoIdTokenCredentials(input));
}

export async function exchangeKakaoAuthorizationCode({
  code,
  config,
  fetchImpl = fetch,
  timeoutMs = 5000,
}: KakaoTokenExchangeInput): Promise<KakaoTokenExchangeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(kakaoTokenEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.restApiKey,
        redirect_uri: config.callbackUrl,
        code,
        client_secret: config.clientSecret,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        status: "error",
        reason: "http",
        httpStatus: response.status,
      };
    }

    let json: unknown;

    try {
      json = await response.json();
    } catch {
      return {
        status: "error",
        reason: "invalid_json",
      };
    }

    if (!isKakaoTokenResponse(json)) {
      return {
        status: "error",
        reason: "missing_id_token",
      };
    }

    return {
      status: "success",
      idToken: json.id_token,
    };
  } catch (error) {
    return {
      status: "error",
      reason: isAbortError(error) ? "timeout" : "network",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function getSupabaseAuthErrorDiagnostic(
  error: unknown,
): SupabaseAuthErrorDiagnostic {
  return {
    code: getStringProperty(error, "code"),
    category: isObjectLike(error) ? "auth_error" : "unknown_error",
  };
}

function isKakaoTokenResponse(value: unknown): value is { id_token: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "id_token" in value &&
    typeof value.id_token === "string" &&
    value.id_token.length > 0
  );
}

function isAbortError(error: unknown) {
  return (
    error instanceof DOMException
      ? error.name === "AbortError"
      : getStringProperty(error, "name") === "AbortError"
  );
}

function getStringProperty(value: unknown, property: string) {
  if (!isObjectLike(value) || !(property in value)) {
    return null;
  }

  const propertyValue = value[property as keyof typeof value];
  return typeof propertyValue === "string" ? propertyValue : null;
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
