import { renderToStaticMarkup } from "react-dom/server";
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

import CreatorStartPage from "./page";

describe("CreatorStartPage", () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockReset();
    mocks.getOwnedCreatorForUser.mockReset();
    mocks.redirect.mockReset();
  });

  it("lets an anonymous visitor start before connecting Kakao", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const html = renderToStaticMarkup(await CreatorStartPage());

    expect(html).toContain("내 콘텐츠의 광고 자리를 등록해보세요");
    expect(html).toContain('href="/creator/onboarding"');
    expect(html).toContain("3분 만에 광고 자리 등록하기");
    expect(html).toContain("등록 신청을 완료할 때 카카오 계정 연결이 필요합니다");
    expect(html).not.toContain("카카오로 시작하기");
  });

  it("keeps the existing creator redirect", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.getOwnedCreatorForUser.mockResolvedValue({ id: "creator-1" });

    await CreatorStartPage();

    expect(mocks.redirect).toHaveBeenCalledWith("/creator");
  });
});
