import { createClient } from "@/lib/supabase/server";
import { readSupabasePublicEnv } from "@/lib/supabase/env";
import { sampleListings } from "./sample-data";
import type {
  CreatorRow,
  ListingRow,
  PlatformFilter,
  PublicCreator,
  PublicListing,
} from "./types";

const publicListingSelect = `
  id,
  slug,
  title,
  platform,
  channel_name,
  channel_url,
  audience_size,
  ad_format,
  description,
  deliverables,
  price_krw,
  image_paths,
  status,
  is_sample,
  published_at,
  created_at,
  updated_at,
  creators!inner (
    id,
    slug,
    display_name,
    bio,
    avatar_path,
    social_links,
    status,
    is_sample,
    is_founding,
    created_at,
    updated_at
  )
`;

export async function getPublicListings(platform: PlatformFilter) {
  const fallback = filterListings(sampleListings, platform);

  if (!hasSupabaseEnv()) {
    return fallback;
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("listings")
      .select(publicListingSelect)
      .eq("status", "published")
      .eq("creators.status", "published")
      .order("created_at", { ascending: false });

    if (platform !== "전체") {
      query = query.eq("platform", platform);
    }

    const { data, error } = await query;

    if (error || !data) {
      return fallback;
    }

    return data
      .map((row) => mapListingRow(row as ListingRow))
      .filter((listing): listing is PublicListing => listing !== null);
  } catch {
    return fallback;
  }
}

export async function getPublicListingBySlug(slug: string) {
  const fallback =
    sampleListings.find((listing) => listing.slug === slug) ?? null;

  if (!hasSupabaseEnv()) {
    return fallback;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("listings")
      .select(publicListingSelect)
      .eq("slug", slug)
      .eq("status", "published")
      .eq("creators.status", "published")
      .maybeSingle();

    if (error || !data) {
      return fallback;
    }

    return mapListingRow(data as ListingRow) ?? fallback;
  } catch {
    return fallback;
  }
}

export function filterListings(
  listings: PublicListing[],
  platform: PlatformFilter,
) {
  if (platform === "전체") {
    return listings;
  }

  return listings.filter((listing) => listing.platform === platform);
}

export function mapListingRow(row: ListingRow) {
  const creatorRow = Array.isArray(row.creators)
    ? row.creators[0]
    : row.creators;

  if (
    !creatorRow ||
    row.status !== "published" ||
    creatorRow.status !== "published"
  ) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    platform: row.platform as PublicListing["platform"],
    channelName: row.channel_name,
    channelUrl: row.channel_url,
    audienceSize: row.audience_size,
    adFormat: row.ad_format,
    description: row.description,
    deliverables: row.deliverables ?? [],
    priceKrw: row.price_krw,
    imagePaths: row.image_paths ?? [],
    status: "published",
    isSample: row.is_sample,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    creator: mapCreatorRow(creatorRow),
  } satisfies PublicListing;
}

function mapCreatorRow(row: CreatorRow): PublicCreator {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.display_name,
    bio: row.bio,
    avatarPath: row.avatar_path,
    socialLinks: row.social_links ?? {},
    status: "published",
    isSample: row.is_sample,
    isFounding: row.is_founding,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function hasSupabaseEnv() {
  try {
    readSupabasePublicEnv();
    return true;
  } catch {
    return false;
  }
}
