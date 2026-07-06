import "server-only";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import type { CreatorSocialLinks, CreatorStatus } from "@/lib/admin/creator-core";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  assertSingleOwnedCreatorCount,
  buildOwnedCreatorLookupFilter,
} from "./owner-core";

export type OwnedCreator = {
  id: string;
  displayName: string;
  slug: string;
  bio: string | null;
  avatarPath: string | null;
  socialLinks: CreatorSocialLinks;
  status: CreatorStatus;
  onboardedAt: string | null;
  publishedListingCount: number;
  hiddenListingCount: number;
  draftListingCount: number;
  nonArchivedListingCount: number;
};

type OwnedCreatorRow = {
  id: string;
  display_name: string;
  slug: string;
  bio: string | null;
  avatar_path: string | null;
  social_links: CreatorSocialLinks | null;
  status: CreatorStatus;
  onboarded_at: string | null;
  listings: Array<{
    id: string;
    status: string;
  }> | null;
};

export async function requireOwnedCreator(nextPath: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return getOwnedCreatorForUser(user.id);
}

export async function getOwnedCreatorForUser(userId: string) {
  const supabase = createAdminClient();
  const filter = buildOwnedCreatorLookupFilter(userId);
  const { data, error } = await supabase
    .from("creators")
    .select(
      `
        id,
        display_name,
        slug,
        bio,
        avatar_path,
        social_links,
        status,
        onboarded_at,
        listings (
          id,
          status
        )
      `,
    )
    .eq("owner_user_id", filter.owner_user_id);

  if (error) {
    throw new Error(`Failed to load owned creator: ${error.message}`);
  }

  if (!assertSingleOwnedCreatorCount((data ?? []).length)) {
    return null;
  }

  const row = data?.[0] as OwnedCreatorRow | undefined;

  if (!row) {
    return null;
  }

  const listings = row.listings ?? [];

  return {
    id: row.id,
    displayName: row.display_name,
    slug: row.slug,
    bio: row.bio,
    avatarPath: row.avatar_path,
    socialLinks: row.social_links ?? {},
    status: row.status,
    onboardedAt: row.onboarded_at,
    publishedListingCount: listings.filter((listing) => listing.status === "published").length,
    hiddenListingCount: listings.filter((listing) => listing.status === "hidden").length,
    draftListingCount: listings.filter((listing) => listing.status === "draft").length,
    nonArchivedListingCount: listings.filter((listing) => listing.status !== "archived").length,
  } satisfies OwnedCreator;
}
