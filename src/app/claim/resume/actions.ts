"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  buildClaimSuccessPayload,
  buildClaimUpdateMatch,
  canUserClaimCreator,
  getClaimLoginNextPath,
  hashClaimToken,
  isClaimLinkUsable,
} from "@/lib/claim/core";
import {
  clearClaimIntentCookie,
  getClaimIntentToken,
} from "@/lib/claim/intent";
import { createAdminClient } from "@/lib/supabase/admin";

type ClaimActionState = {
  message?: string;
};

export async function claimCreatorFromIntent(
  _state: ClaimActionState,
  _formData?: FormData,
): Promise<ClaimActionState> {
  void _state;
  void _formData;

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(getClaimLoginNextPath())}`);
  }

  const supabase = createAdminClient();
  const { data: connectedCreators, error: connectedError } = await supabase
    .from("creators")
    .select("id")
    .eq("owner_user_id", user.id);

  if (connectedError) {
    return { message: "크리에이터 연결 상태를 확인하지 못했습니다." };
  }

  if (
    !canUserClaimCreator({
      connectedCreatorCount: (connectedCreators ?? []).length,
    })
  ) {
    await clearClaimIntentCookie();
    return { message: "이미 다른 크리에이터 프로필이 연결된 계정입니다." };
  }

  const rawToken = await getClaimIntentToken();

  if (!rawToken) {
    await clearClaimIntentCookie();
    return { message: "이 온보딩 링크는 유효하지 않거나 만료되었습니다." };
  }

  const tokenHash = hashClaimToken(rawToken);
  const { data: creator, error: readError } = await supabase
    .from("creators")
    .select("id, owner_user_id, claim_expires_at, status")
    .eq("claim_token_hash", tokenHash)
    .maybeSingle();

  if (
    readError ||
    !creator ||
    !isClaimLinkUsable({
      claimExpiresAt: creator.claim_expires_at as string | null,
      ownerUserId: creator.owner_user_id as string | null,
      status: creator.status as string,
      now: new Date(),
    })
  ) {
    await clearClaimIntentCookie();
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
    .neq("status", "archived")
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    await clearClaimIntentCookie();
    return { message: "이 온보딩 링크는 유효하지 않거나 만료되었습니다." };
  }

  await clearClaimIntentCookie();
  redirect("/creator");
}
