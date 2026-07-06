import { NextResponse, type NextRequest } from "next/server";
import { sanitizeNextPath } from "@/lib/auth/redirect";
import {
  exchangeKakaoAuthorizationCode,
  isValidKakaoCallbackState,
  kakaoOAuthClearCookieOptions,
  kakaoOAuthNextCookieName,
  kakaoOAuthNonceCookieName,
  kakaoOAuthStateCookieName,
  readKakaoOAuthConfig,
  signInWithKakaoIdToken,
} from "@/lib/auth/kakao";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const callbackState = requestUrl.searchParams.get("state");
  const kakaoError = requestUrl.searchParams.get("error");
  const storedState = request.cookies.get(kakaoOAuthStateCookieName)?.value ?? null;
  const nonce = request.cookies.get(kakaoOAuthNonceCookieName)?.value ?? null;
  const nextPath = sanitizeNextPath(
    request.cookies.get(kakaoOAuthNextCookieName)?.value,
  );

  if (
    kakaoError ||
    !code ||
    !nonce ||
    !isValidKakaoCallbackState({ storedState, callbackState })
  ) {
    return redirectToLogin(requestUrl, nextPath);
  }

  try {
    const config = readKakaoOAuthConfig();
    const tokenResult = await exchangeKakaoAuthorizationCode({
      code,
      config,
    });

    if (tokenResult.status !== "success") {
      return redirectToLogin(requestUrl, nextPath);
    }

    const supabase = await createClient();
    const { error } = await signInWithKakaoIdToken(supabase.auth, {
      idToken: tokenResult.idToken,
      nonce,
    });

    if (error) {
      return redirectToLogin(requestUrl, nextPath);
    }

    return withClearedKakaoCookies(
      NextResponse.redirect(new URL(nextPath, requestUrl.origin)),
    );
  } catch {
    return redirectToLogin(requestUrl, nextPath);
  }
}

function redirectToLogin(url: URL, nextPath: string) {
  const loginUrl = new URL("/login", url.origin);
  loginUrl.searchParams.set("next", nextPath);
  loginUrl.searchParams.set("error", "kakao");
  return withClearedKakaoCookies(NextResponse.redirect(loginUrl));
}

function withClearedKakaoCookies(response: NextResponse) {
  const options = kakaoOAuthClearCookieOptions();
  response.cookies.set(kakaoOAuthStateCookieName, "", options);
  response.cookies.set(kakaoOAuthNonceCookieName, "", options);
  response.cookies.set(kakaoOAuthNextCookieName, "", options);
  return response;
}
