import { existsSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { ListingCard } from "@/components/marketplace/listing-card";
import { shouldShowSampleBadge } from "./badges";
import {
  filterListings,
  getPublicListingBySlug,
  getPublicListings,
  usesLocalSampleData,
} from "./data";
import { sampleListings } from "./sample-data";

describe("marketplace public data", () => {
  it("keeps eight sample listings across four creators", () => {
    const listingCountByCreator = new Map<string, number>();

    for (const listing of sampleListings) {
      listingCountByCreator.set(
        listing.creator.displayName,
        (listingCountByCreator.get(listing.creator.displayName) ?? 0) + 1,
      );
    }

    expect(sampleListings).toHaveLength(8);
    expect(Array.from(listingCountByCreator.entries())).toEqual([
      ["제주한바퀴", 2],
      ["오늘의제주", 2],
      ["살림의기록", 2],
      ["한입서울", 2],
    ]);
  });

  it("points every sample listing to an existing local sample image", () => {
    for (const listing of sampleListings) {
      expect(listing.imagePaths).toHaveLength(1);
      expect(listing.imagePaths[0]).toMatch(/^\/images\/samples\/.+\.webp$/);
      expect(
        existsSync(join(process.cwd(), "public", listing.imagePaths[0])),
      ).toBe(true);
    }
  });

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

  it("loads a sample listing detail by slug when Supabase env is missing", async () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const listing = await getPublicListingBySlug("sample-food-instagram-post");

    restoreEnv("NEXT_PUBLIC_SUPABASE_URL", previousUrl);
    restoreEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", previousKey);

    expect(listing?.creator.displayName).toBe("한입서울");
    expect(listing?.title).toBe("서울 맛집 Instagram 피드 소개");
    expect(listing?.imagePaths[0]).toBe(
      "/images/samples/hanip-seoul-instagram-feed.webp",
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

    expect(html).toContain("예시 상품");
    expect(html).toContain("제주한바퀴");
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

    expect(html).not.toContain("예시 상품");
  });

  it("renders the public home with platform filter and listing grid content", async () => {
    const element = await Home({
      searchParams: Promise.resolve({ platform: "TikTok" }),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("누가, 어디에, 무엇을, 얼마에 해주는가.");
    expect(html).toContain(
      "크리에이터의 광고 자리를 직접 보고 원하는 광고를 진행해보세요.",
    );
    expect(html).not.toContain(
      "지금은 실제 거래 검증을 위한 예시 광고 상품을 먼저 보여드립니다.",
    );
    expect(html).toContain("모두의 창업 1R 선정 · MVP 검증 중");
    expect(html).toContain("Pyda는 지금 막 시작했습니다.");
    expect(html).toContain(
      "원하는 광고 조건을 남겨주시면 조건에 맞는 크리에이터를 직접 찾아 섭외 가능 여부와 예상 견적을 확인해드립니다.",
    );
    expect(html).toContain("견적 확인까지 비용이 없습니다.");
    expect(html).not.toContain(
      "현재 공개된 상품은 광고 거래 방식을 보여드리기 위한 예시입니다.",
    );
    expect(html).toContain("전체");
    expect(html).toContain("YouTube");
    expect(html).toContain("Instagram");
    expect(html).toContain("네이버 블로그");
    expect(html).toContain("TikTok");
    expect(html).toContain("음식·간편식 TikTok 20초 숏폼");
    expect(html).not.toContain("이런 식으로 광고할 수 있어요");
    expect(html).not.toContain("제주 카페");
    expect(html).toContain(
      "상품에 광고를 요청하거나, 원하는 광고 조건을 직접 알려주세요.",
    );
    expect(html).toContain('href="/advertise"');
    expect(html).toContain("제주에서 크리에이터 광고 연결을 검증하고 있습니다.");
    expect(html).not.toContain("예시 상품으로 첫 거래 흐름을 검증합니다.");
  });
});
