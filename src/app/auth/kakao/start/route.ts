import { NextResponse, type NextRequest } from "next/server";
import { sanitizeNextPath } from "@/lib/auth/redirect";
import {
  buildKakaoAuthorizeUrl,
  generateKakaoOAuthToken,
  hashKakaoOAuthNonce,
  kakaoOAuthCookieOptions,
  kakaoOAuthNextCookieName,
  kakaoOAuthNonceCookieName,
  kakaoOAuthStateCookieName,
  readKakaoOAuthConfig,
} from "@/lib/auth/kakao";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));

  let authorizeUrl: URL;
  let state: string;
  let rawNonce: string;

  try {
    const config = readKakaoOAuthConfig();
    state = generateKakaoOAuthToken();
    rawNonce = generateKakaoOAuthToken();
    authorizeUrl = buildKakaoAuthorizeUrl({
      config,
      state,
      hashedNonce: hashKakaoOAuthNonce(rawNonce),
    });
  } catch {
    return redirectToLogin(requestUrl, nextPath);
  }

  const response = NextResponse.redirect(authorizeUrl);
  const cookieOptions = kakaoOAuthCookieOptions();
  response.cookies.set(kakaoOAuthStateCookieName, state, cookieOptions);
  response.cookies.set(kakaoOAuthNonceCookieName, rawNonce, cookieOptions);
  response.cookies.set(kakaoOAuthNextCookieName, nextPath, cookieOptions);
  return response;
}

function redirectToLogin(url: URL, nextPath: string) {
  const loginUrl = new URL("/login", url.origin);
  loginUrl.searchParams.set("next", nextPath);
  loginUrl.searchParams.set("error", "kakao");
  return NextResponse.redirect(loginUrl);
}
