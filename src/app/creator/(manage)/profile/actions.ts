"use server";

import { revalidatePath } from "next/cache";
import {
  buildCreatorProfileUpdatePayload,
  creatorSelfManageBlockedMessage,
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

  const blockedMessage = creatorSelfManageBlockedMessage(creator.status);

  if (blockedMessage) {
    return { message: blockedMessage };
  }

  const parsed = validateCreatorProfileForm({
    displayName: stringValue(formData.get("displayName")),
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
      message: "프로필을 저장하지 못했습니다.",
    };
  }

  const previousAvatarToCleanup = getPreviousStorageAvatarToCleanup({
    previousAvatarPath: creator.avatarPath,
    nextAvatarPath,
  });

  if (previousAvatarToCleanup) {
    await cleanupStorageObjects([previousAvatarToCleanup]);
  }

  revalidateCreatorPaths(creator.slug);
  return { ok: true, message: "프로필을 저장했습니다." };
}

function revalidateCreatorPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/creator");
  revalidatePath("/creator/profile");

  revalidatePath(`/creators/${slug}`);
}

function getAvatarFile(formData: FormData) {
  const value = formData.get("avatarImage");
  return value instanceof File && value.size > 0 && value.name.length > 0
    ? value
    : null;
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function nullableStringValue(value: FormDataEntryValue | null) {
  const string = stringValue(value).trim();
  return string.length > 0 ? string : null;
}
