"use server";

import { revalidatePath } from "next/cache";
import {
  buildCreatorProfileUpdatePayload,
  getPreviousStorageAvatarToCleanup,
  validateCreatorProfileForm,
  type CreatorProfileFormErrors,
} from "@/lib/creator/core";
import { requireOwnedCreator } from "@/lib/creator/owner";
import { cleanupStorageObjects, uploadAvatarImage } from "@/lib/admin/storage";
import { createClient } from "@/lib/supabase/server";

export type CreatorProfileFormState = {
  errors?: CreatorProfileFormErrors & { avatar?: string };
  message?: string;
  ok?: boolean;
};

export async function updateCreatorProfile(
  _state: CreatorProfileFormState,
  formData: FormData,
): Promise<CreatorProfileFormState> {
  void _state;

  const creator = await requireOwnedCreator("/creator/profile");

  if (!creator) {
    return { message: "연결된 크리에이터 프로필이 없습니다." };
  }

  const parsed = validateCreatorProfileForm({
    displayName: stringValue(formData.get("displayName")),
    slug: stringValue(formData.get("slug")),
    bio: nullableStringValue(formData.get("bio")),
    youtube: nullableStringValue(formData.get("youtube")),
    instagram: nullableStringValue(formData.get("instagram")),
    blog: nullableStringValue(formData.get("blog")),
    tiktok: nullableStringValue(formData.get("tiktok")),
  });

  if (!parsed.ok) {
    return { errors: parsed.errors };
  }

  const avatarFile = getAvatarFile(formData);
  const removeAvatar = formData.get("removeAvatar") === "on";
  const uploadedAvatar = avatarFile
    ? await uploadAvatarImage({ creatorId: creator.id, file: avatarFile })
    : null;

  if (uploadedAvatar && !uploadedAvatar.ok) {
    return { errors: { avatar: uploadedAvatar.message } };
  }

  const nextAvatarPath = uploadedAvatar?.ok
    ? uploadedAvatar.path
    : removeAvatar
      ? null
      : creator.avatarPath;

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("creators")
    .update({
      ...buildCreatorProfileUpdatePayload(parsed.data),
      avatar_path: nextAvatarPath,
    })
    .eq("id", creator.id)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    if (uploadedAvatar?.ok) {
      await cleanupStorageObjects([uploadedAvatar.path]);
    }

    return {
      message: error && isDuplicateSlugError(error)
        ? "이미 사용 중인 slug입니다."
        : "프로필을 저장하지 못했습니다.",
    };
  }

  const previousAvatarToCleanup = getPreviousStorageAvatarToCleanup({
    previousAvatarPath: creator.avatarPath,
    nextAvatarPath,
  });

  if (previousAvatarToCleanup) {
    await cleanupStorageObjects([previousAvatarToCleanup]);
  }

  revalidateCreatorPaths(creator.slug, parsed.data.slug);
  return { ok: true, message: "프로필을 저장했습니다." };
}

function revalidateCreatorPaths(previousSlug: string, nextSlug: string) {
  revalidatePath("/");
  revalidatePath("/creator");
  revalidatePath("/creator/profile");

  if (previousSlug !== nextSlug) {
    revalidatePath(`/creators/${previousSlug}`);
    revalidatePath(`/creators/${nextSlug}`);
  }
}

function getAvatarFile(formData: FormData) {
  const value = formData.get("avatarImage");
  return value instanceof File && value.size > 0 && value.name.length > 0
    ? value
    : null;
}

function isDuplicateSlugError(error: { code?: string; message?: string }) {
  return error.code === "23505" || error.message?.includes("creators_slug_key");
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function nullableStringValue(value: FormDataEntryValue | null) {
  const string = stringValue(value).trim();
  return string.length > 0 ? string : null;
}
