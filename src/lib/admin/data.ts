import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { RequestStatus } from "@/lib/requests/status";

export type AdminDashboardStats = {
  publishedCreators: number;
  publishedListings: number;
  submittedRequests: number;
  completedRequests: number;
};

export type AdminRequestSummary = {
  id: string;
  contactName: string;
  brandName: string;
  listingTitle: string;
  creatorName: string;
  quotedAmountKrw: number | null;
  status: RequestStatus;
  createdAt: string;
};

export type AdminRequestDetail = AdminRequestSummary & {
  contactChannel: string;
  contactValue: string;
  campaignBrief: string;
  preferredStartDate: string | null;
  preferredEndDate: string | null;
  adminNotes: string | null;
};

type AdminRequestRow = {
  id: string;
  contact_name: string;
  brand_name: string;
  contact_channel: string;
  contact_value?: string;
  campaign_brief?: string;
  preferred_start_date?: string | null;
  preferred_end_date?: string | null;
  quoted_amount_krw: number | null;
  status: RequestStatus;
  admin_notes?: string | null;
  created_at: string;
  listings:
    | {
        title: string | null;
        creators:
          | {
              display_name: string | null;
            }
          | Array<{
              display_name: string | null;
            }>
          | null;
      }
    | Array<{
        title: string | null;
        creators:
          | {
              display_name: string | null;
            }
          | Array<{
              display_name: string | null;
            }>
          | null;
      }>
    | null;
};

const adminRequestSelect = `
  id,
  contact_name,
  brand_name,
  contact_channel,
  contact_value,
  campaign_brief,
  preferred_start_date,
  preferred_end_date,
  quoted_amount_krw,
  status,
  admin_notes,
  created_at,
  listings (
    title,
    creators (
      display_name
    )
  )
`;

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = createAdminClient();
  const [
    publishedCreators,
    publishedListings,
    submittedRequests,
    completedRequests,
  ] = await Promise.all([
    countRows(supabase, "creators", "status", "published"),
    countRows(supabase, "listings", "status", "published"),
    countRows(supabase, "requests", "status", "submitted"),
    countRows(supabase, "requests", "status", "completed"),
  ]);

  return {
    publishedCreators,
    publishedListings,
    submittedRequests,
    completedRequests,
  };
}

export async function getAdminRequests(): Promise<AdminRequestSummary[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("requests")
    .select(adminRequestSelect)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load admin requests: ${error.message}`);
  }

  return (data ?? []).map((row) => mapAdminRequest(row as AdminRequestRow));
}

export async function getAdminRequestById(
  id: string,
): Promise<AdminRequestDetail | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("requests")
    .select(adminRequestSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load admin request: ${error.message}`);
  }

  return data ? mapAdminRequestDetail(data as AdminRequestRow) : null;
}

async function countRows(
  supabase: ReturnType<typeof createAdminClient>,
  table: "creators" | "listings" | "requests",
  column: "status",
  value: string,
) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, value);

  if (error) {
    throw new Error(`Failed to count ${table}: ${error.message}`);
  }

  return count ?? 0;
}

function mapAdminRequest(row: AdminRequestRow): AdminRequestSummary {
  const listing = Array.isArray(row.listings) ? row.listings[0] : row.listings;
  const creator = Array.isArray(listing?.creators)
    ? listing?.creators[0]
    : listing?.creators;

  return {
    id: row.id,
    contactName: row.contact_name,
    brandName: row.brand_name,
    listingTitle: listing?.title ?? "광고 상품 정보 없음",
    creatorName: creator?.display_name ?? "크리에이터 정보 없음",
    quotedAmountKrw: row.quoted_amount_krw,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapAdminRequestDetail(row: AdminRequestRow): AdminRequestDetail {
  return {
    ...mapAdminRequest(row),
    contactChannel: row.contact_channel,
    contactValue: row.contact_value ?? "",
    campaignBrief: row.campaign_brief ?? "",
    preferredStartDate: row.preferred_start_date ?? null,
    preferredEndDate: row.preferred_end_date ?? null,
    adminNotes: row.admin_notes ?? null,
  };
}
