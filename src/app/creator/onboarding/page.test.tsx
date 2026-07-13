import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getOwnedCreatorForUser: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));
vi.mock("@/lib/creator/owner", () => ({
  getOwnedCreatorForUser: mocks.getOwnedCreatorForUser,
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/components/navigation/public-header", () => ({
  getPublicHeaderProfileForUser: vi.fn(async () => null),
  PublicHeader: () => <header>Pyda</header>,
}));
vi.mock("./actions", () => ({
  submitCreatorOnboarding: vi.fn(async () => ({})),
}));

import CreatorOnboardingPage from "./page";

describe("CreatorOnboardingPage", () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockReset();
    mocks.getOwnedCreatorForUser.mockReset();
    mocks.redirect.mockReset();
  });

  it("renders the onboarding form for an anonymous visitor", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const html = renderToStaticMarkup(await CreatorOnboardingPage());

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(html).toContain("어떤 광고 자리를 열 수 있나요?");
    expect(html).toContain("YouTube 영상 속 짧은 소개");
    expect(html).toContain("YouTube 기존 영상 고정댓글");
    expect(html).toContain("YouTube 기존 영상 설명란 상단");
    expect(html).toContain("Instagram 릴스 속 짧은 소개");
    expect(html).toContain("Instagram 프로필 링크 또는 하이라이트");
    expect(html).not.toContain('name="coverImage"');
  });

  it("keeps the optional image available for an authenticated visitor", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.getOwnedCreatorForUser.mockResolvedValue(null);

    await CreatorOnboardingPage();
    const source = readFileSync(
      join(process.cwd(), "src/components/creator/onboarding-form.tsx"),
      "utf8",
    );

    expect(source).toContain("isAuthenticated ? (");
    expect(source).toContain('name="coverImage"');
  });

  it("keeps the duplicate creator redirect", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.getOwnedCreatorForUser.mockResolvedValue({ id: "creator-1" });

    await CreatorOnboardingPage();

    expect(mocks.redirect).toHaveBeenCalledWith("/creator");
  });
});
