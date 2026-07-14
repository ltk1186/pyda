"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  assertExistingImageSubset,
  buildOrderedImagePaths,
  validateImageCount,
  validateImageOrder,
  type ImageOrderItem,
  type ImageOrderMode,
  type ListingStatus,
} from "@/lib/admin/listing-core";
import { cleanupStorageObjects, uploadListingImages } from "@/lib/admin/storage";
import {
  buildCreatorListingInsertPayload,
  buildCreatorListingUpdatePayload,
  buildGeneratedManagedListingSlug,
  creatorSelfManageBlockedMessage,
  validateCreatorListingBase,
  type CreatorListingFormErrors,
} from "@/lib/creator/core";
import { getCreatorListingById } from "@/lib/creator/listings";
import { requireOwnedCreator } from "@/lib/creator/owner";
import { createClient } from "@/lib/supabase/server";
import {
  isListingVisibilityPreference,
  resolveCreatorListingState,
} from "@/lib/listing-visibility";

export type CreatorListingFormState = {
  errors?: CreatorListingFormErrors;
  message?: string;
  ok?: boolean;
};

export async function createCreatorListing(
  _state: CreatorListingFormState,
  formData: FormData,
): Promise<CreatorListingFormState> {
  void _state;

  const creator = await requireOwnedCreator("/creator/listings/new");

  if (!creator) {
    return { message: "연결된 크리에이터 프로필이 없습니다." };
  }

  const blockedMessage = creatorSelfManageBlockedMessage(creator.status);

  if (blockedMessage) {
    return { message: blockedMessage };
  }

  const files = getImageFiles(formData);
  const imageOrder = parseStrictImageOrder({
    currentImagePaths: [],
    formData,
    mode: "create",
    newImageCount: files.length,
  });

  if (!imageOrder.ok) {
    return { errors: { images: imageOrder.message } };
  }

  const listingId = crypto.randomUUID();
  const parsed = parseCreatorListingForm(
    formData,
    imageOrder.order.length,
    {
      status: null,
      publishedAt: null,
    },
    buildGeneratedManagedListingSlug(listingId),
  );

  if (!parsed.ok) {
    return { errors: parsed.errors };
  }

  const uploaded = await uploadListingImages({
    creatorId: creator.id,
    listingId,
    files,
  });

  if (!uploaded.ok) {
    return { errors: { images: uploaded.message } };
  }

  const uploadedPaths = uploaded.uploaded.map((image) => image.path);
  const finalImagePaths = buildOrderedImagePaths({
    currentImagePaths: [],
    uploadedImagePaths: uploadedPaths,
    imageOrder: imageOrder.order,
  });
  const imageError = validateImageCount(parsed.data.status, finalImagePaths.length);

  if (imageError) {
    await cleanupStorageObjects(uploadedPaths);
    return { errors: { images: imageError } };
  }

  const publishedAt = parsed.data.publishedAt;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .insert(
      buildCreatorListingInsertPayload({
        input: parsed.data,
        creatorId: creator.id,
        listingId,
        imagePaths: finalImagePaths,
        publishedAt,
      }),
    )
    .select("id")
    .single();

  if (error) {
    await cleanupStorageObjects(uploadedPaths);
    return {
      message: isDuplicateSlugError(error)
        ? "이미 사용 중인 slug입니다."
        : "광고 상품을 생성하지 못했습니다.",
    };
  }

  revalidateCreatorListingPaths(data.id as string, parsed.data.slug);
  redirect(`/creator/listings/${data.id}/edit`);
}

export async function updateCreatorListing(
  listingId: string,
  _state: CreatorListingFormState,
  formData: FormData,
): Promise<CreatorListingFormState> {
  void _state;

  const creator = await requireOwnedCreator(`/creator/listings/${listingId}/edit`);

  if (!creator) {
    return { message: "연결된 크리에이터 프로필이 없습니다." };
  }

  const blockedMessage = creatorSelfManageBlockedMessage(creator.status);

  if (blockedMessage) {
    return { message: blockedMessage };
  }

  const current = await getCreatorListingById({
    creatorId: creator.id,
    listingId,
  });

  if (!current) {
    return { message: "광고 상품을 찾지 못했습니다." };
  }

  const currentImagePaths = current.imagePaths;
  const files = getImageFiles(formData);
  const imageOrder = parseStrictImageOrder({
    currentImagePaths,
    formData,
    mode: "update",
    newImageCount: files.length,
  });

  if (!imageOrder.ok) {
    return { errors: { images: imageOrder.message } };
  }

  const requestedExistingPaths = imageOrder.order
    .filter((item) => item.kind === "existing")
    .map((item) => item.path);

  if (!assertExistingImageSubset(currentImagePaths, requestedExistingPaths)) {
    return { errors: { images: "현재 상품에 연결된 기존 이미지만 유지할 수 있습니다." } };
  }

  const parsed = parseCreatorListingForm(
    formData,
    imageOrder.order.length,
    {
      status: current.status,
      publishedAt: current.publishedAt,
    },
    current.slug,
  );

  if (!parsed.ok) {
    return { errors: parsed.errors };
  }

  const uploaded = await uploadListingImages({
    creatorId: creator.id,
    listingId,
    files,
  });

  if (!uploaded.ok) {
    return { errors: { images: uploaded.message } };
  }

  const uploadedPaths = uploaded.uploaded.map((image) => image.path);
  const finalImagePaths = buildOrderedImagePaths({
    currentImagePaths,
    uploadedImagePaths: uploadedPaths,
    imageOrder: imageOrder.order,
  });
  const imageError = validateImageCount(parsed.data.status, finalImagePaths.length);

  if (imageError) {
    await cleanupStorageObjects(uploadedPaths);
    return { errors: { images: imageError } };
  }

  const publishedAt = parsed.data.publishedAt;
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("listings")
    .update(
      buildCreatorListingUpdatePayload({
        input: parsed.data,
        imagePaths: finalImagePaths,
        publishedAt,
      }),
    )
    .eq("id", listingId)
    .eq("creator_id", creator.id)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    await cleanupStorageObjects(uploadedPaths);
    return {
      message: error && isDuplicateSlugError(error)
        ? "이미 사용 중인 slug입니다."
        : "광고 상품을 저장하지 못했습니다.",
    };
  }

  const removedExistingPaths = currentImagePaths.filter(
    (path) => !path.startsWith("/") && !finalImagePaths.includes(path),
  );
  await cleanupStorageObjects(removedExistingPaths);

  revalidateCreatorListingPaths(listingId, parsed.data.slug, current.slug);
  return { ok: true, message: "광고 상품을 저장했습니다." };
}

function parseCreatorListingForm(
  formData: FormData,
  imageCount: number,
  current: { status: ListingStatus | null; publishedAt: string | null },
  slug: string,
) {
  const visibilityPreference = stringValue(
    formData.get("visibilityPreference"),
  );

  if (!isListingVisibilityPreference(visibilityPreference)) {
    return {
      ok: false as const,
      errors: { status: "광고 자리 운영 방식을 선택해주세요." },
    };
  }

  const nextState = resolveCreatorListingState({
    currentStatus: current.status,
    currentPublishedAt: current.publishedAt,
    visibilityPreference,
  });
  const base = validateCreatorListingBase({
    title: stringValue(formData.get("title")),
    slug,
    platform: stringValue(formData.get("platform")),
    channelUrl: nullableStringValue(formData.get("channelUrl")),
    audienceSize: nullableStringValue(formData.get("audienceSize")),
    adFormat: stringValue(formData.get("adFormat")),
    deliverablesText: nullableStringValue(formData.get("deliverables")),
    priceKrw: stringValue(formData.get("priceKrw")),
    status: nextState.status,
    imageCount,
  });

  if (!base.ok) {
    return base;
  }

  return {
    ok: true as const,
    data: {
      ...base.data,
      channelName: nullableStringValue(formData.get("channelName")),
      description: nullableStringValue(formData.get("description")),
      visibilityPreference,
      publishedAt: nextState.publishedAt,
    },
  };
}

function getImageFiles(formData: FormData) {
  return formData
    .getAll("newImages")
    .filter(
      (value): value is File =>
        value instanceof File && value.size > 0 && value.name.length > 0,
    );
}

function parseStrictImageOrder(params: {
  currentImagePaths: string[];
  formData: FormData;
  mode: ImageOrderMode;
  newImageCount: number;
}):
  | {
      ok: true;
      order: ImageOrderItem[];
    }
  | {
      ok: false;
      message: string;
    } {
  const rawOrder = params.formData
    .getAll("imageOrder")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);

  return validateImageOrder({
    currentImagePaths: params.currentImagePaths,
    mode: params.mode,
    newImageCount: params.newImageCount,
    rawOrder,
  });
}

function isDuplicateSlugError(error: { code?: string; message?: string }) {
  return error.code === "23505" || error.message?.includes("listings_slug_key");
}

function revalidateCreatorListingPaths(
  listingId: string,
  nextSlug?: string,
  previousSlug?: string,
) {
  revalidatePath("/");
  revalidatePath("/creator");
  revalidatePath("/creator/listings");
  revalidatePath(`/creator/listings/${listingId}/edit`);

  if (previousSlug) {
    revalidatePath(`/listings/${previousSlug}`);
  }

  if (nextSlug) {
    revalidatePath(`/listings/${nextSlug}`);
  }
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function nullableStringValue(value: FormDataEntryValue | null) {
  const string = stringValue(value).trim();
  return string.length > 0 ? string : null;
}
