"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cleanupStorageObjects, uploadListingImages } from "@/lib/admin/storage";
import { getCurrentUser } from "@/lib/auth/session";
import {
  buildCreatorOnboardingCreatorPayload,
  buildCreatorOnboardingListingPayload,
  buildGeneratedCreatorSlug,
  buildGeneratedListingSlug,
  validateCreatorOnboardingInput,
  type CreatorOnboardingErrors,
} from "@/lib/creator/onboarding-core";
import { getOwnedCreatorForUser } from "@/lib/creator/owner";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreatorOnboardingFormState = {
  errors?: CreatorOnboardingErrors;
  message?: string;
};

export async function submitCreatorOnboarding(
  _state: CreatorOnboardingFormState,
  formData: FormData,
): Promise<CreatorOnboardingFormState> {
  void _state;

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/creator/onboarding")}`);
  }

  const existingCreator = await getOwnedCreatorForUser(user.id);

  if (existingCreator) {
    return { message: "이미 연결된 크리에이터 프로필이 있습니다." };
  }

  const parsed = validateCreatorOnboardingInput({
    adSlot: formData.get("adSlot"),
    displayName: formData.get("displayName"),
    youtubeName: formData.get("youtubeName"),
    youtubeUrl: formData.get("youtubeUrl"),
    youtubeAudienceSize: formData.get("youtubeAudienceSize"),
    instagramName: formData.get("instagramName"),
    instagramUrl: formData.get("instagramUrl"),
    instagramAudienceSize: formData.get("instagramAudienceSize"),
    selectedPlatform: formData.get("selectedPlatform"),
    bio: formData.get("bio"),
    inventoryType: formData.get("inventoryType"),
    optionKeys: formData.getAll("optionKeys"),
    placementFeeManwon: formData.get("placementFeeManwon"),
    productionFeeManwon: formData.get("productionFeeManwon"),
    turnaroundDays: formData.get("turnaroundDays"),
    maintenanceDays: formData.get("maintenanceDays"),
    mentionSeconds: formData.get("mentionSeconds"),
    storyCount: formData.get("storyCount"),
  });

  if (!parsed.ok) {
    return { errors: parsed.errors };
  }

  const imageFile = getCoverImageFile(formData);

  if (imageFile === "too_many") {
    return { errors: { image: "대표 이미지는 최대 1장만 선택할 수 있습니다." } };
  }

  const creatorId = crypto.randomUUID();
  const listingId = crypto.randomUUID();
  const creatorSlug = buildGeneratedCreatorSlug(creatorId);
  const listingSlug = buildGeneratedListingSlug({
    platform: parsed.data.selectedPlatform,
    inventoryType: parsed.data.inventoryType,
    randomId: listingId,
  });
  const nowIso = new Date().toISOString();
  const uploaded = imageFile
    ? await uploadListingImages({
        creatorId,
        listingId,
        files: [imageFile],
      })
    : { ok: true as const, uploaded: [] };

  if (!uploaded.ok) {
    return { errors: { image: uploaded.message } };
  }

  const uploadedPaths = uploaded.uploaded.map((image) => image.path);
  const supabase = createAdminClient();
  const creatorPayload = buildCreatorOnboardingCreatorPayload({
    input: parsed.data,
    creatorId,
    ownerUserId: user.id,
    creatorSlug,
    nowIso,
  });
  const listingPayload = buildCreatorOnboardingListingPayload({
    input: parsed.data,
    creatorId,
    listingId,
    listingSlug,
    imagePaths: uploadedPaths,
  });

  const { error: creatorError } = await supabase
    .from("creators")
    .insert(creatorPayload);

  if (creatorError) {
    await cleanupStorageObjects(uploadedPaths);
    console.error("creator_onboarding_creator_insert_failed", {
      code: creatorError.code ?? null,
    });
    return {
      message: isOwnerUniqueError(creatorError)
        ? "이미 연결된 크리에이터 프로필이 있습니다."
        : "크리에이터 등록을 저장하지 못했습니다.",
    };
  }

  const { error: listingError } = await supabase
    .from("listings")
    .insert(listingPayload);

  if (listingError) {
    await cleanupStorageObjects(uploadedPaths);
    await supabase.from("creators").delete().eq("id", creatorId);
    console.error("creator_onboarding_listing_insert_failed", {
      code: listingError.code ?? null,
    });
    return { message: "첫 광고 자리를 저장하지 못했습니다." };
  }

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/creator");
  redirect("/creator/onboarding/complete");
}

function getCoverImageFile(formData: FormData) {
  const files = formData
    .getAll("coverImage")
    .filter(
      (value): value is File =>
        value instanceof File && value.size > 0 && value.name.length > 0,
    );

  if (files.length > 1) {
    return "too_many" as const;
  }

  return files[0] ?? null;
}

function isOwnerUniqueError(error: { code?: string; message?: string }) {
  return (
    error.code === "23505" ||
    error.message?.includes("creators_owner_user_id_unique")
  );
}
