import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  kakaoOAuthNextCookieName,
  kakaoOAuthNonceCookieName,
  kakaoOAuthStateCookieName,
} from "@/lib/auth/kakao";
import { GET } from "./route";

describe("/auth/kakao/start", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stores a safe next path and redirects to Kakao authorization", async () => {
    stubKakaoEnv();

    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/kakao/start?next=%2Flistings%2Fsample%3Frequest%3D1",
      ),
    );

    const location = response.headers.get("location");
    expect(location).toContain("https://kauth.kakao.com/oauth/authorize");
    expect(location).toContain("scope=openid%2Cprofile_nickname%2Cprofile_image");
    expect(location).not.toContain("account_email");
    expect(response.cookies.get(kakaoOAuthNextCookieName)?.value).toBe(
      "/listings/sample?request=1",
    );
    expect(response.cookies.get(kakaoOAuthStateCookieName)?.value).toHaveLength(
      43,
    );
    expect(response.cookies.get(kakaoOAuthNonceCookieName)?.value).toHaveLength(
      43,
    );
  });

  it("falls back unsafe next paths to /", async () => {
    stubKakaoEnv();

    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/kakao/start?next=https%3A%2F%2Fevil.com",
      ),
    );

    expect(response.cookies.get(kakaoOAuthNextCookieName)?.value).toBe("/");
  });

  it("redirects safely when Kakao config is missing", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/kakao/start?next=%2Fadmin",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fadmin&error=kakao",
    );
  });
});

function stubKakaoEnv() {
  vi.stubEnv("KAKAO_REST_API_KEY", "rest-key");
  vi.stubEnv("KAKAO_CLIENT_SECRET", "client-secret");
  vi.stubEnv("APP_BASE_URL", "http://localhost:3000");
}
