"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  buildClaimSuccessPayload,
  buildClaimUpdateMatch,
  hashClaimToken,
  isClaimLinkUsable,
} from "@/lib/claim/core";
import { createAdminClient } from "@/lib/supabase/admin";

export type ClaimActionState = {
  message?: string;
};

export async function claimCreatorProfile(
  rawToken: string,
  _state: ClaimActionState,
  _formData?: FormData,
): Promise<ClaimActionState> {
  void _state;
  void _formData;

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/claim/${rawToken}`)}`);
  }

  const tokenHash = hashClaimToken(rawToken);
  const supabase = createAdminClient();
  const { data: creator, error: readError } = await supabase
    .from("creators")
    .select("id, owner_user_id, claim_expires_at")
    .eq("claim_token_hash", tokenHash)
    .maybeSingle();

  if (
    readError ||
    !creator ||
    !isClaimLinkUsable({
      claimExpiresAt: creator.claim_expires_at as string | null,
      ownerUserId: creator.owner_user_id as string | null,
      now: new Date(),
    })
  ) {
    return { message: "이 온보딩 링크는 유효하지 않거나 만료되었습니다." };
  }

  const nowIso = new Date().toISOString();
  const match = buildClaimUpdateMatch({
    creatorId: creator.id as string,
    tokenHash,
  });
  const { data: updated, error } = await supabase
    .from("creators")
    .update(buildClaimSuccessPayload({ nowIso, userId: user.id }))
    .eq("id", match.id)
    .is("owner_user_id", match.owner_user_id)
    .eq("claim_token_hash", match.claim_token_hash)
    .gt("claim_expires_at", nowIso)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    return { message: "이 온보딩 링크는 유효하지 않거나 만료되었습니다." };
  }

  redirect("/creator");
}
