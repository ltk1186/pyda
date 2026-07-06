import "server-only";

import {
  cleanSocialLinks,
  getCreatorPlatformLabels,
  type CreatorSocialLinks,
  type CreatorStatus,
} from "./creator-core";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminCreatorSummary = {
  id: string;
  slug: string;
  displayName: string;
  bio: string | null;
  avatarPath: string | null;
  socialLinks: CreatorSocialLinks;
  status: CreatorStatus;
  isSample: boolean;
  isFounding: boolean;
  isClaimed: boolean;
  listingCount: number;
  platformLabels: string[];
  createdAt: string;
};

export type AdminCreatorDetail = AdminCreatorSummary & {
  ownerUserId: string | null;
  onboardedAt: string | null;
  claimedAt: string | null;
  foundingGrantedAt: string | null;
  publishedListingSlugs: string[];
  effectivePublicListingCount: number;
  updatedAt: string;
};

type AdminCreatorRow = {
  id: string;
  owner_user_id: string | null;
  slug: string;
  display_name: string;
  bio: string | null;
  avatar_path: string | null;
  social_links: unknown;
  status: CreatorStatus;
  is_sample: boolean;
  onboarded_at?: string | null;
  claimed_at?: string | null;
  is_founding: boolean;
  founding_granted_at?: string | null;
  created_at: string;
  updated_at?: string;
  listings:
    | Array<{
        id: string;
        platform: string | null;
        slug: string | null;
        status: string | null;
      }>
    | null;
};

const adminCreatorSelect = `
  id,
  owner_user_id,
  slug,
  display_name,
  bio,
  avatar_path,
  social_links,
  status,
  is_sample,
  onboarded_at,
  claimed_at,
  is_founding,
  founding_granted_at,
  created_at,
  updated_at,
  listings (
    id,
    platform,
    slug,
    status
  )
`;

export async function getAdminCreators(): Promise<AdminCreatorSummary[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("creators")
    .select(adminCreatorSelect)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load admin creators: ${error.message}`);
  }

  return (data ?? []).map((row) => mapAdminCreator(row as AdminCreatorRow));
}

export async function getAdminCreatorById(
  id: string,
): Promise<AdminCreatorDetail | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("creators")
    .select(adminCreatorSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load admin creator: ${error.message}`);
  }

  return data ? mapAdminCreatorDetail(data as AdminCreatorRow) : null;
}

function mapAdminCreator(row: AdminCreatorRow): AdminCreatorSummary {
  const listings = row.listings ?? [];
  const socialLinks = normalizeCreatorSocialLinks(row.social_links);
  const listingPlatforms = listings
    .map((listing) => listing.platform ?? "")
    .filter(Boolean);

  return {
    id: row.id,
    slug: row.slug,
    displayName: row.display_name,
    bio: row.bio,
    avatarPath: row.avatar_path,
    socialLinks,
    status: row.status,
    isSample: row.is_sample,
    isFounding: row.is_founding,
    isClaimed: row.owner_user_id !== null,
    listingCount: listings.length,
    platformLabels: getCreatorPlatformLabels(socialLinks, listingPlatforms),
    createdAt: row.created_at,
  };
}

function mapAdminCreatorDetail(row: AdminCreatorRow): AdminCreatorDetail {
  const listings = row.listings ?? [];
  const publishedListingSlugs = listings
    .filter((listing) => listing.status === "published")
    .flatMap((listing) => (listing.slug ? [listing.slug] : []));

  return {
    ...mapAdminCreator(row),
    ownerUserId: row.owner_user_id,
    onboardedAt: row.onboarded_at ?? null,
    claimedAt: row.claimed_at ?? null,
    foundingGrantedAt: row.founding_granted_at ?? null,
    publishedListingSlugs,
    effectivePublicListingCount:
      row.status === "published" ? publishedListingSlugs.length : 0,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

function normalizeCreatorSocialLinks(value: unknown): CreatorSocialLinks {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return cleanSocialLinks(value as Partial<Record<keyof CreatorSocialLinks, unknown>>);
}
