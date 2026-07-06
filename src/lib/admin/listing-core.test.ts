import { describe, expect, it } from "vitest";
import {
  assertExistingImageSubset,
  buildStorageObjectPath,
  isAllowedImageMimeType,
  nextPublishedAt,
  parseDeliverables,
  validateAdminListingBase,
  validateImageCount,
  validateImageOrder,
} from "./listing-core";

describe("admin listing validation", () => {
  it("accepts valid listing input", () => {
    const result = validateAdminListingBase({
      creatorId: "creator-id",
      title: "영상 소개",
      slug: "youtube-intro",
      platform: "YouTube",
      channelUrl: "https://youtube.com/@pyda",
      audienceSize: "1000",
      adFormat: "영상 내 30초 소개",
      deliverablesText: "브랜드 소개\n고정 댓글",
      priceKrw: "500000",
      status: "published",
      imageCount: 1,
    });

    expect(result.ok).toBe(true);
  });

  it("rejects invalid slug, price, audience size, and channel URL", () => {
    const result = validateAdminListingBase({
      creatorId: "creator-id",
      title: "영상 소개",
      slug: "Bad Slug",
      platform: "YouTube",
      channelUrl: "javascript:alert(1)",
      audienceSize: "-1",
      adFormat: "영상 내 30초 소개",
      deliverablesText: "",
      priceKrw: "0",
      status: "draft",
      imageCount: 0,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.slug).toBeTruthy();
      expect(result.errors.channelUrl).toBeTruthy();
      expect(result.errors.audienceSize).toBeTruthy();
      expect(result.errors.priceKrw).toBeTruthy();
    }
  });

  it("normalizes one-deliverable-per-line input", () => {
    expect(parseDeliverables("  촬영본 1개  \n\n고정 댓글\n ")).toEqual([
      "촬영본 1개",
      "고정 댓글",
    ]);
  });

  it("requires 1 to 3 images for published listings", () => {
    expect(validateImageCount("published", 0)).toBeTruthy();
    expect(validateImageCount("published", 1)).toBeNull();
    expect(validateImageCount("published", 3)).toBeNull();
    expect(validateImageCount("published", 4)).toBeTruthy();
    expect(validateImageCount("draft", 0)).toBeNull();
  });

  it("allows only supported image MIME types", () => {
    expect(isAllowedImageMimeType("image/jpeg")).toBe(true);
    expect(isAllowedImageMimeType("image/png")).toBe(true);
    expect(isAllowedImageMimeType("image/webp")).toBe(true);
    expect(isAllowedImageMimeType("image/gif")).toBe(false);
  });

  it("checks retained image paths are a subset of current DB paths", () => {
    expect(assertExistingImageSubset(["a", "b"], ["b"])).toBe(true);
    expect(assertExistingImageSubset(["a", "b"], ["c"])).toBe(false);
  });

  it("builds storage object paths under the listing namespace", () => {
    expect(
      buildStorageObjectPath({
        creatorId: "creator-id",
        listingId: "listing-id",
        randomId: "random",
        extension: ".webp",
      }),
    ).toBe("creators/creator-id/listings/listing-id/random.webp");
  });

  it("sets published_at only on first publish", () => {
    expect(
      nextPublishedAt({
        currentPublishedAt: null,
        previousStatus: "draft",
        nextStatus: "published",
        nowIso: "2026-07-06T00:00:00.000Z",
      }),
    ).toBe("2026-07-06T00:00:00.000Z");

    expect(
      nextPublishedAt({
        currentPublishedAt: "2026-07-01T00:00:00.000Z",
        previousStatus: "hidden",
        nextStatus: "published",
        nowIso: "2026-07-06T00:00:00.000Z",
      }),
    ).toBe("2026-07-01T00:00:00.000Z");
  });
});

describe("validateImageOrder", () => {
  it("rejects duplicate existing image order", () => {
    const result = validateImageOrder({
      currentImagePaths: ["existing-a"],
      mode: "update",
      newImageCount: 0,
      rawOrder: ["existing:existing-a", "existing:existing-a"],
    });

    expect(result.ok).toBe(false);
  });

  it("rejects duplicate new image indexes", () => {
    const result = validateImageOrder({
      currentImagePaths: [],
      mode: "create",
      newImageCount: 1,
      rawOrder: ["new:0", "new:0"],
    });

    expect(result.ok).toBe(false);
  });

  it("rejects out-of-range new image indexes", () => {
    const result = validateImageOrder({
      currentImagePaths: [],
      mode: "create",
      newImageCount: 1,
      rawOrder: ["new:1"],
    });

    expect(result.ok).toBe(false);
  });

  it("rejects missing new file indexes", () => {
    const result = validateImageOrder({
      currentImagePaths: [],
      mode: "create",
      newImageCount: 2,
      rawOrder: ["new:0"],
    });

    expect(result.ok).toBe(false);
  });

  it("rejects unknown image order tokens", () => {
    const result = validateImageOrder({
      currentImagePaths: [],
      mode: "create",
      newImageCount: 0,
      rawOrder: ["bad:token"],
    });

    expect(result.ok).toBe(false);
  });

  it("allows valid mixed order", () => {
    const result = validateImageOrder({
      currentImagePaths: ["existing-a"],
      mode: "update",
      newImageCount: 2,
      rawOrder: ["new:1", "existing:existing-a", "new:0"],
    });

    expect(result).toEqual({
      ok: true,
      order: [
        { kind: "new", index: 1 },
        { kind: "existing", path: "existing-a" },
        { kind: "new", index: 0 },
      ],
    });
  });

  it("rejects final image order above three items", () => {
    const result = validateImageOrder({
      currentImagePaths: ["a"],
      mode: "update",
      newImageCount: 3,
      rawOrder: ["existing:a", "new:0", "new:1", "new:2"],
    });

    expect(result.ok).toBe(false);
  });

  it("rejects existing images during create", () => {
    const result = validateImageOrder({
      currentImagePaths: ["a"],
      mode: "create",
      newImageCount: 0,
      rawOrder: ["existing:a"],
    });

    expect(result.ok).toBe(false);
  });
});
