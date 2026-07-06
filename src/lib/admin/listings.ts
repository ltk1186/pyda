import "server-only";

import type {
  ListingPlatform,
  ListingStatus,
} from "@/lib/admin/listing-core";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminListingSampleFilter = "all" | "real" | "sample";

export type AdminListingSummary = {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  slug: string;
  platform: ListingPlatform;
  adFormat: string;
  priceKrw: number;
  imagePaths: string[];
  status: ListingStatus;
  isSample: boolean;
  createdAt: string;
};

export type AdminListingDetail = AdminListingSummary & {
  channelName: string | null;
  channelUrl: string | null;
  audienceSize: number | null;
  description: string | null;
  deliverables: string[];
  publishedAt: string | null;
};

export type AdminListingCreatorOption = {
  id: string;
  displayName: string;
  status: string;
};

type AdminListingRow = {
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
  is_sample: boolean;
  published_at: string | null;
  created_at: string;
  creators:
    | {
        display_name: string | null;
      }
    | Array<{
        display_name: string | null;
      }>
    | null;
};

const adminListingSelect = `
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
  is_sample,
  published_at,
  created_at,
  creators (
    display_name
  )
`;

export async function getAdminListings(filter: AdminListingSampleFilter) {
  const supabase = createAdminClient();
  let query = supabase
    .from("listings")
    .select(adminListingSelect)
    .order("created_at", { ascending: false });

  if (filter === "real") {
    query = query.eq("is_sample", false);
  } else if (filter === "sample") {
    query = query.eq("is_sample", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load admin listings: ${error.message}`);
  }

  return (data ?? []).map((row) => mapAdminListing(row as AdminListingRow));
}

export async function getAdminListingById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("listings")
    .select(adminListingSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load admin listing: ${error.message}`);
  }

  return data ? mapAdminListingDetail(data as AdminListingRow) : null;
}

export async function getAdminListingCreatorOptions() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("creators")
    .select("id, display_name, status")
    .neq("status", "archived")
    .order("display_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load listing creator options: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    displayName: row.display_name as string,
    status: row.status as string,
  })) satisfies AdminListingCreatorOption[];
}

function mapAdminListing(row: AdminListingRow): AdminListingSummary {
  const creator = Array.isArray(row.creators) ? row.creators[0] : row.creators;

  return {
    id: row.id,
    creatorId: row.creator_id,
    creatorName: creator?.display_name ?? "크리에이터 정보 없음",
    title: row.title,
    slug: row.slug,
    platform: row.platform,
    adFormat: row.ad_format,
    priceKrw: row.price_krw,
    imagePaths: row.image_paths ?? [],
    status: row.status,
    isSample: row.is_sample,
    createdAt: row.created_at,
  };
}

function mapAdminListingDetail(row: AdminListingRow): AdminListingDetail {
  return {
    ...mapAdminListing(row),
    channelName: row.channel_name,
    channelUrl: row.channel_url,
    audienceSize: row.audience_size,
    description: row.description,
    deliverables: row.deliverables ?? [],
    publishedAt: row.published_at,
  };
}
