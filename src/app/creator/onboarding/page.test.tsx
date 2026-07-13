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
    expect(html).toContain("어디에서 콘텐츠를 만들고 있나요?");
    expect(html).not.toContain('name="coverImage"');
  });

  it("keeps the optional image available for an authenticated visitor", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.getOwnedCreatorForUser.mockResolvedValue(null);

    const html = renderToStaticMarkup(await CreatorOnboardingPage());

    expect(html).toContain('name="coverImage"');
  });

  it("keeps the duplicate creator redirect", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.getOwnedCreatorForUser.mockResolvedValue({ id: "creator-1" });

    await CreatorOnboardingPage();

    expect(mocks.redirect).toHaveBeenCalledWith("/creator");
  });
});
