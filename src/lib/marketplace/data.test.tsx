import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { ListingCard } from "@/components/marketplace/listing-card";
import { shouldShowSampleBadge } from "./badges";
import { filterListings, getPublicListings, usesLocalSampleData } from "./data";
import { sampleListings } from "./sample-data";

describe("marketplace public data", () => {
  it("filters sample listings by platform", () => {
    const youtubeListings = filterListings(sampleListings, "YouTube");

    expect(youtubeListings).toHaveLength(3);
    expect(youtubeListings.every((listing) => listing.platform === "YouTube")).toBe(
      true,
    );
  });

  it("falls back to sample listings when Supabase env is not configured", async () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const listings = await getPublicListings("Instagram");

    restoreEnv("NEXT_PUBLIC_SUPABASE_URL", previousUrl);
    restoreEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", previousKey);

    expect(listings).toHaveLength(3);
    expect(listings.every((listing) => listing.platform === "Instagram")).toBe(
      true,
    );
  });

  it("uses local sample data only when Supabase env is missing", () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(usesLocalSampleData()).toBe(true);

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    expect(usesLocalSampleData()).toBe(false);

    restoreEnv("NEXT_PUBLIC_SUPABASE_URL", previousUrl);
    restoreEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", previousKey);
  });
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

describe("marketplace rendering", () => {
  it("renders a listing card with required marketplace fields", () => {
    const html = renderToStaticMarkup(
      <ListingCard listing={sampleListings[0]} />,
    );

    expect(html).toContain("예시 광고 상품");
    expect(html).toContain("김지윤");
    expect(html).toContain("Founding Creator");
    expect(html).toContain("YouTube");
    expect(html).toContain("영상 내 30초 소개");
    expect(html).toContain("제주 여행 영상 내 30초 브랜드 소개");
    expect(html).toContain("₩500,000");
  });

  it("shows sample badges only for sample listings", () => {
    expect(shouldShowSampleBadge({ isSample: true })).toBe(true);
    expect(shouldShowSampleBadge({ isSample: false })).toBe(false);

    const realListing = {
      ...sampleListings[0],
      isSample: false,
    };
    const html = renderToStaticMarkup(<ListingCard listing={realListing} />);

    expect(html).not.toContain("예시 광고 상품");
  });

  it("renders the public home with platform filter and listing grid content", async () => {
    const element = await Home({
      searchParams: Promise.resolve({ platform: "TikTok" }),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("누가, 어디에, 무엇을, 얼마에 해주는가.");
    expect(html).toContain("전체");
    expect(html).toContain("YouTube");
    expect(html).toContain("Instagram");
    expect(html).toContain("네이버 블로그");
    expect(html).toContain("TikTok");
    expect(html).toContain("TikTok 간편식 20초 맛보기");
  });
});
