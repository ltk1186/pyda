import { describe, expect, it } from "vitest";
import {
  canAdminPublishListing,
  getListingOperationState,
  resolveCreatorListingState,
} from "./listing-visibility";

describe("listing visibility policy", () => {
  it("allows admin publishing only after a public review request", () => {
    expect(canAdminPublishListing("private_matching")).toBe(false);
    expect(canAdminPublishListing("public_review")).toBe(true);
  });

  it("keeps new and review-requested creator listings in draft", () => {
    expect(
      resolveCreatorListingState({
        currentStatus: null,
        currentPublishedAt: null,
        visibilityPreference: "private_matching",
      }),
    ).toEqual({ status: "draft", publishedAt: null });
    expect(
      resolveCreatorListingState({
        currentStatus: "draft",
        currentPublishedAt: null,
        visibilityPreference: "public_review",
      }),
    ).toEqual({ status: "draft", publishedAt: null });
  });

  it("hides a published listing immediately when direct matching is selected", () => {
    expect(
      resolveCreatorListingState({
        currentStatus: "published",
        currentPublishedAt: "2026-07-14T00:00:00.000Z",
        visibilityPreference: "private_matching",
      }),
    ).toEqual({ status: "draft", publishedAt: null });
  });

  it("describes matching, review, and public states in creator language", () => {
    expect(getListingOperationState({ status: "draft", visibilityPreference: "private_matching" }).label).toBe("직접 매칭 중");
    expect(getListingOperationState({ status: "draft", visibilityPreference: "public_review" }).label).toBe("공개 검토 중");
    expect(getListingOperationState({ status: "published", visibilityPreference: "public_review" }).label).toBe("메인 공개 중");
  });
});
