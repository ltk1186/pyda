import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hashClaimToken, isClaimLinkUsable } from "./core";

export type ClaimCreator = {
  id: string;
  displayName: string;
};

export type OwnedCreatorSummary = {
  id: string;
  displayName: string;
  publishedListingCount: number;
  hiddenListingCount: number;
};

type ClaimCreatorRow = {
  id: string;
  display_name: string;
  owner_user_id: string | null;
  claim_expires_at: string | null;
  status: string;
};

export async function getValidClaimCreator(rawToken: string) {
  const tokenHash = hashClaimToken(rawToken);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("creators")
    .select("id, display_name, owner_user_id, claim_expires_at, status")
    .eq("claim_token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load claim creator: ${error.message}`);
  }

  const row = data as ClaimCreatorRow | null;

  if (
    !row ||
    !isClaimLinkUsable({
      claimExpiresAt: row.claim_expires_at,
      ownerUserId: row.owner_user_id,
      status: row.status,
      now: new Date(),
    })
  ) {
    return null;
  }

  return {
    id: row.id,
    displayName: row.display_name,
  } satisfies ClaimCreator;
}

export async function getConnectedCreatorCount(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("creators")
    .select("id")
    .eq("owner_user_id", userId);

  if (error) {
    throw new Error(`Failed to load connected creators: ${error.message}`);
  }

  return (data ?? []).length;
}

export async function getOwnedCreatorSummary(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("creators")
    .select(
      `
        id,
        display_name,
        listings (
          id,
          status
        )
      `,
    )
    .eq("owner_user_id", userId);

  if (error) {
    throw new Error(`Failed to load owned creator: ${error.message}`);
  }

  if ((data ?? []).length > 1) {
    throw new Error("Multiple creator profiles are connected to this user.");
  }

  const row = data?.[0];

  if (!row) {
    return null;
  }

  const listings =
    (row.listings as Array<{ id: string; status: string }> | null) ?? [];

  return {
    id: row.id as string,
    displayName: row.display_name as string,
    publishedListingCount: listings.filter((listing) => listing.status === "published").length,
    hiddenListingCount: listings.filter((listing) => listing.status === "hidden").length,
  } satisfies OwnedCreatorSummary;
}
