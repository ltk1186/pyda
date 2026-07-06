import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import {
  kakaoOAuthNextCookieName,
  kakaoOAuthNonceCookieName,
  kakaoOAuthStateCookieName,
} from "@/lib/auth/kakao";
import { GET } from "./route";

describe("/auth/kakao/callback", () => {
  it("handles Kakao errors without exposing raw error details", async () => {
    const response = await GET(
      requestWithCookies(
        "http://localhost:3000/auth/kakao/callback?error=access_denied&error_description=raw",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fclaim%2Fresume&error=kakao",
    );
    expect(response.headers.get("location")).not.toContain("access_denied");
    expect(response.headers.get("location")).not.toContain("raw");
  });

  it("rejects missing code", async () => {
    const response = await GET(
      requestWithCookies("http://localhost:3000/auth/kakao/callback?state=state"),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fclaim%2Fresume&error=kakao",
    );
  });

  it("rejects state mismatch and clears intent cookies", async () => {
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
});

function requestWithCookies(url: string) {
  return new NextRequest(url, {
    headers: {
      cookie: [
        `${kakaoOAuthStateCookieName}=state`,
        `${kakaoOAuthNonceCookieName}=nonce`,
        `${kakaoOAuthNextCookieName}=/claim/resume`,
      ].join("; "),
    },
  });
}
