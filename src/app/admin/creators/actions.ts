"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  buildAdminCreatorInsertPayload,
  buildAdminCreatorUpdatePayload,
  parseAdminCreatorFormData,
  type AdminCreatorFormErrors,
} from "@/lib/admin/creator-core";
import {
  canGenerateClaimLink,
  claimExpiresAt,
  generateClaimToken,
  hashClaimToken,
} from "@/lib/claim/core";
import { readFoundingProgramConfig } from "@/lib/founding/config";
import {
  buildFoundingApprovalMatch,
  buildFoundingApprovalPayload,
  evaluateFoundingEligibility,
  getEffectivePublicListingCount,
} from "@/lib/founding/core";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminCreatorFormState = {
  errors?: AdminCreatorFormErrors;
  message?: string;
  ok?: boolean;
};

export type AdminClaimLinkState = {
  claimPath?: string;
  message?: string;
  ok?: boolean;
};

export type AdminFoundingApprovalState = {
  message?: string;
  ok?: boolean;
};

export async function createAdminCreator(
  _state: AdminCreatorFormState,
  formData: FormData,
): Promise<AdminCreatorFormState> {
  await requireAdmin("/admin/creators/new");

  const parsed = parseAdminCreatorFormData(formData);

  if (!parsed.ok) {
    return { errors: parsed.errors };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("creators")
    .insert(buildAdminCreatorInsertPayload(parsed.data))
    .select("id")
    .single();

  if (error) {
    return {
      message: isDuplicateSlugError(error)
        ? "이미 사용 중인 slug입니다."
        : "크리에이터를 생성하지 못했습니다.",
    };
  }

  revalidateCreatorPaths(data.id);
  redirect(`/admin/creators/${data.id}`);
}

export async function updateAdminCreator(
  creatorId: string,
  _state: AdminCreatorFormState,
  formData: FormData,
): Promise<AdminCreatorFormState> {
  await requireAdmin(`/admin/creators/${creatorId}`);

  const parsed = parseAdminCreatorFormData(formData);

  if (!parsed.ok) {
    return { errors: parsed.errors };
  }

  const supabase = createAdminClient();
  const { data: current, error: readError } = await supabase
    .from("creators")
    .select("id")
    .eq("id", creatorId)
    .maybeSingle();

  if (readError || !current) {
    return { message: "크리에이터를 찾지 못했습니다." };
  }

  const { error } = await supabase
    .from("creators")
    .update(buildAdminCreatorUpdatePayload(parsed.data))
    .eq("id", creatorId);

  if (error) {
    return {
      message: isDuplicateSlugError(error)
        ? "이미 사용 중인 slug입니다."
        : "크리에이터를 저장하지 못했습니다.",
    };
  }

  revalidateCreatorPaths(creatorId);
  return { ok: true, message: "크리에이터 정보를 저장했습니다." };
}

export async function generateCreatorClaimLink(
  creatorId: string,
  _state: AdminClaimLinkState,
  _formData?: FormData,
): Promise<AdminClaimLinkState> {
  void _state;
  void _formData;

  await requireAdmin(`/admin/creators/${creatorId}`);

  const supabase = createAdminClient();
  const { data: creator, error: readError } = await supabase
    .from("creators")
    .select("id, owner_user_id, status")
    .eq("id", creatorId)
    .maybeSingle();

  if (readError || !creator) {
    return { message: "크리에이터를 찾지 못했습니다." };
  }

  if (creator.owner_user_id !== null) {
    return { message: "이미 계정이 연결된 크리에이터입니다." };
  }

  if (
    !canGenerateClaimLink({
      ownerUserId: creator.owner_user_id as string | null,
      status: creator.status as string,
    })
  ) {
    return { message: "보관된 크리에이터는 온보딩 링크를 생성할 수 없습니다." };
  }

  const rawToken = generateClaimToken();
  const tokenHash = hashClaimToken(rawToken);
  const expiresAt = claimExpiresAt(new Date()).toISOString();
  const { data: updated, error } = await supabase
    .from("creators")
    .update({
      claim_token_hash: tokenHash,
      claim_expires_at: expiresAt,
    })
    .eq("id", creatorId)
    .is("owner_user_id", null)
    .neq("status", "archived")
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    return { message: "온보딩 링크를 생성하지 못했습니다." };
  }

  revalidateCreatorPaths(creatorId);
  return {
    ok: true,
    claimPath: `/claim/${rawToken}`,
    message: "온보딩 링크를 생성했습니다. 이 링크는 이번 한 번만 표시됩니다.",
  };
}

export async function approveFoundingCreator(
  creatorId: string,
  _state: AdminFoundingApprovalState,
  _formData?: FormData,
): Promise<AdminFoundingApprovalState> {
  void _state;
  void _formData;

  await requireAdmin(`/admin/creators/${creatorId}`);

  const supabase = createAdminClient();
  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .select("id, status, is_sample, onboarded_at, is_founding")
    .eq("id", creatorId)
    .maybeSingle();

  if (creatorError || !creator) {
    return { message: "크리에이터를 찾지 못했습니다." };
  }

  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select("slug, status")
    .eq("creator_id", creatorId);

  if (listingsError) {
    return { message: "공개 광고 상품 상태를 확인하지 못했습니다." };
  }

  const publishedListingSlugs = (listings ?? [])
    .filter((listing) => listing.status === "published")
    .flatMap((listing) => (typeof listing.slug === "string" ? [listing.slug] : []));
  const effectivePublicListingCount = getEffectivePublicListingCount({
    creatorStatus: creator.status as string,
    publishedListingCount: publishedListingSlugs.length,
  });
  const eligibility = evaluateFoundingEligibility({
    program: readFoundingProgramConfig(),
    onboardedAt: creator.onboarded_at as string | null,
    creatorStatus: creator.status as string,
    isSample: Boolean(creator.is_sample),
    effectivePublicListingCount,
    isFounding: Boolean(creator.is_founding),
  });

  if (eligibility.alreadyFounding) {
    return { message: "이미 Founding Creator로 확정되었습니다." };
  }

  if (!eligibility.eligibleForApproval) {
    return { message: "Founding Creator 확정 조건을 만족하지 못했습니다." };
  }

  const nowIso = new Date().toISOString();
  const match = buildFoundingApprovalMatch({ creatorId });
  const { data: updated, error } = await supabase
    .from("creators")
    .update(buildFoundingApprovalPayload({ nowIso }))
    .eq("id", match.id)
    .eq("is_founding", match.is_founding)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    return {
      message: "Founding Creator 상태가 이미 변경되었습니다. 새로고침 후 다시 확인해주세요.",
    };
  }

  revalidateCreatorPaths(creatorId);
  revalidatePath("/");
  revalidatePath("/creator");

  for (const slug of publishedListingSlugs) {
    revalidatePath(`/listings/${slug}`);
  }

  return { ok: true, message: "Founding Creator로 확정했습니다." };
}

function isDuplicateSlugError(error: { code?: string; message?: string }) {
  return error.code === "23505" || error.message?.includes("creators_slug_key");
}

function revalidateCreatorPaths(creatorId: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/creators");
  revalidatePath(`/admin/creators/${creatorId}`);
}
