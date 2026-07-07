import { describe, expect, it } from "vitest";
import {
  buildAccountProfileSummary,
  buildCreatorActivitySummary,
  buildLoginHref,
  getProfileInitial,
  summarizeRequests,
} from "./core";

describe("account core", () => {
  it("builds login hrefs with a safe next path parameter", () => {
    expect(buildLoginHref("/listings/sample?request=1")).toBe(
      "/login?next=%2Flistings%2Fsample%3Frequest%3D1",
    );
  });

  it("uses profile fields before Kakao metadata and never requires email", () => {
    expect(
      buildAccountProfileSummary({
        profileDisplayName: "프로필 이름",
        profileAvatarUrl: "https://example.com/profile.png",
        metadata: {
          nickname: "카카오 닉네임",
          picture: "https://example.com/kakao.png",
        },
      }),
    ).toEqual({
      displayName: "프로필 이름",
      avatarUrl: "https://example.com/profile.png",
    });
  });

  it("falls back to Kakao nickname metadata without email", () => {
    expect(
      buildAccountProfileSummary({
        metadata: {
          nickname: "카카오 사용자",
          picture: "https://example.com/avatar.png",
        },
      }),
    ).toEqual({
      displayName: "카카오 사용자",
      avatarUrl: "https://example.com/avatar.png",
    });
  });

  it("summarizes all and active advertiser requests", () => {
    expect(
      summarizeRequests([
        { status: "submitted" },
        { status: "in_progress" },
        { status: "completed" },
        { status: "cancelled" },
      ]),
    ).toEqual({
      totalCount: 4,
      activeCount: 2,
    });
  });

  it("describes users without a connected creator profile", () => {
    expect(buildCreatorActivitySummary(null)).toMatchObject({
      kind: "none",
      title: "크리에이터 프로필 없음",
    });
  });

  it("links published creators to the existing creator dashboard", () => {
    expect(
      buildCreatorActivitySummary({
        status: "published",
        displayName: "오늘의제주",
        publishedListingCount: 1,
        nonArchivedListingCount: 2,
      }),
    ).toEqual({
      kind: "published",
      title: "오늘의제주",
      description: "광고 상품 2개 · 공개 중 1개",
      managementHref: "/creator",
    });
  });

  it("keeps archived creators visible but without a management link", () => {
    expect(
      buildCreatorActivitySummary({
        status: "archived",
        displayName: "보관된 채널",
        publishedListingCount: 0,
        nonArchivedListingCount: 0,
      }),
    ).toMatchObject({
      kind: "existing",
      managementHref: null,
    });
  });

  it("builds a compact profile fallback initial", () => {
    expect(getProfileInitial("오늘의제주")).toBe("오");
    expect(getProfileInitial(" ")).toBe("P");
  });
});
