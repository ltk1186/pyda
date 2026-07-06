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

function isDuplicateSlugError(error: { code?: string; message?: string }) {
  return error.code === "23505" || error.message?.includes("creators_slug_key");
}

function revalidateCreatorPaths(creatorId: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/creators");
  revalidatePath(`/admin/creators/${creatorId}`);
}
