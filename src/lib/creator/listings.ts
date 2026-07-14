import "server-only";

import type {
  ListingPlatform,
  ListingStatus,
} from "@/lib/admin/listing-core";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ListingVisibilityPreference } from "@/lib/listing-visibility";

export type CreatorListingSummary = {
  id: string;
  title: string;
  slug: string;
  platform: ListingPlatform;
  adFormat: string;
  priceKrw: number;
  imagePaths: string[];
  status: ListingStatus;
  createdAt: string;
  visibilityPreference: ListingVisibilityPreference;
};

export type CreatorListingDetail = CreatorListingSummary & {
  creatorId: string;
  channelName: string | null;
  channelUrl: string | null;
  audienceSize: number | null;
  description: string | null;
  deliverables: string[];
  publishedAt: string | null;
};

type CreatorListingRow = {
  id: string;
  creator_id: string;
  slug: string;
  title: string;
  platform: ListingPlatform;
  channel_name: string | null;
  channel_url: string | null;
  audience_size: number | null;
  ad_format: string;
  description: string | null;
  deliverables: string[] | null;
  price_krw: number;
  image_paths: string[] | null;
  status: ListingStatus;
  published_at: string | null;
  created_at: string;
  visibility_preference: ListingVisibilityPreference;
};

const creatorListingSelect = `
  id,
  creator_id,
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
  published_at,
  created_at,
  visibility_preference
`;

export async function getCreatorListings(creatorId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("listings")
    .select(creatorListingSelect)
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load creator listings: ${error.message}`);
  }

  return (data ?? []).map((row) => mapListing(row as CreatorListingRow));
}

export async function getCreatorListingById(params: {
  creatorId: string;
  listingId: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("listings")
    .select(creatorListingSelect)
    .eq("id", params.listingId)
    .eq("creator_id", params.creatorId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load creator listing: ${error.message}`);
  }

  return data ? mapListingDetail(data as CreatorListingRow) : null;
}

function mapListing(row: CreatorListingRow): CreatorListingSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    platform: row.platform,
    adFormat: row.ad_format,
    priceKrw: row.price_krw,
    imagePaths: row.image_paths ?? [],
    status: row.status,
    createdAt: row.created_at,
    visibilityPreference: row.visibility_preference,
  };
}

function mapListingDetail(row: CreatorListingRow): CreatorListingDetail {
  return {
    ...mapListing(row),
    creatorId: row.creator_id,
    channelName: row.channel_name,
    channelUrl: row.channel_url,
    audienceSize: row.audience_size,
    description: row.description,
    deliverables: row.deliverables ?? [],
    publishedAt: row.published_at,
  };
}
