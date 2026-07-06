import { describe, expect, it } from "vitest";
import { isPublishedMarketplaceListing } from "./dashboard-core";

describe("isPublishedMarketplaceListing", () => {
  it("matches the public marketplace listing condition", () => {
    expect(
      isPublishedMarketplaceListing({
        status: "published",
        creators: { status: "published" },
      }),
    ).toBe(true);
  });

  it("rejects published listings whose creator is not published", () => {
    expect(
      isPublishedMarketplaceListing({
        status: "published",
        creators: { status: "hidden" },
      }),
    ).toBe(false);
  });

  it("rejects non-published listings", () => {
    expect(
      isPublishedMarketplaceListing({
        status: "hidden",
        creators: { status: "published" },
      }),
    ).toBe(false);
  });
});
