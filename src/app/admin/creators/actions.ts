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
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminCreatorFormState = {
  errors?: AdminCreatorFormErrors;
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

function isDuplicateSlugError(error: { code?: string; message?: string }) {
  return error.code === "23505" || error.message?.includes("creators_slug_key");
}

function revalidateCreatorPaths(creatorId: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/creators");
  revalidatePath(`/admin/creators/${creatorId}`);
}
