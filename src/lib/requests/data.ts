import { createClient } from "@/lib/supabase/server";
import type { RequestStatus } from "./status";

const requestSelect = `
  id,
  listing_id,
  brand_name,
  campaign_brief,
  preferred_start_date,
  preferred_end_date,
  status,
  created_at,
  listings (
    id,
    slug,
    title,
    status
  )
`;

export type AdvertiserRequest = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingSlug: string | null;
  brandName: string;
  campaignBrief: string;
  preferredStartDate: string | null;
  preferredEndDate: string | null;
  status: RequestStatus;
  createdAt: string;
};

type RequestRow = {
  id: string;
  listing_id: string;
  brand_name: string;
  campaign_brief: string;
  preferred_start_date: string | null;
  preferred_end_date: string | null;
  status: RequestStatus;
  created_at: string;
  listings:
    | {
        id: string;
        slug: string | null;
        title: string | null;
        status: string | null;
      }
    | Array<{
        id: string;
        slug: string | null;
        title: string | null;
        status: string | null;
      }>
    | null;
};

export async function getAdvertiserRequests(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requests")
    .select(requestSelect)
    .eq("advertiser_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load advertiser requests: ${error.message}`);
  }

  return (data ?? []).map((row) => mapRequestRow(row as RequestRow));
}

export async function getAdvertiserRequestById(userId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requests")
    .select(requestSelect)
    .eq("advertiser_user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load advertiser request: ${error.message}`);
  }

  return data ? mapRequestRow(data as RequestRow) : null;
}

function mapRequestRow(row: RequestRow): AdvertiserRequest {
  const listing = Array.isArray(row.listings) ? row.listings[0] : row.listings;

  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: listing?.title ?? "현재 비공개인 광고 상품",
    listingSlug: listing?.slug ?? null,
    brandName: row.brand_name,
    campaignBrief: row.campaign_brief,
    preferredStartDate: row.preferred_start_date,
    preferredEndDate: row.preferred_end_date,
    status: row.status,
    createdAt: row.created_at,
  };
}
