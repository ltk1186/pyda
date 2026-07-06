import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildKakaoOAuthRedirectTo,
  kakaoOAuthProvider,
} from "./kakao-login-button";

const root = process.cwd();

describe("KakaoLoginButton OAuth config", () => {
  it("uses Kakao as the fixed OAuth provider", () => {
    expect(kakaoOAuthProvider).toBe("kakao");
  });

  it("builds callback redirectTo with the original safe next path", () => {
    expect(
      buildKakaoOAuthRedirectTo(
        "http://localhost:3000",
        "/listings/sample?request=1",
      ),
    ).toBe(
      "http://localhost:3000/auth/callback?next=%2Flistings%2Fsample%3Frequest%3D1",
    );
  });

  it("does not keep the old multi-provider component", () => {
    expect(
      existsSync(join(root, "src/components/auth/oauth-buttons.tsx")),
    ).toBe(false);
  });

  it("does not expose the old provider option in the login UI", () => {
    const loginPage = readFileSync(
      join(root, "src/app/login/page.tsx"),
      "utf8",
    );
    const kakaoButton = readFileSync(
      join(root, "src/components/auth/kakao-login-button.tsx"),
      "utf8",
    );

    const oldProviderPattern = new RegExp("goo" + "gle", "i");

    expect(loginPage).not.toMatch(oldProviderPattern);
    expect(kakaoButton).not.toMatch(oldProviderPattern);
    expect(kakaoButton).toContain("카카오로 시작하기");
  });
});
