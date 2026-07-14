"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  assertExistingImageSubset,
  buildAdminListingInsertPayload,
  buildAdminListingUpdatePayload,
  buildOrderedImagePaths,
  nextPublishedAt,
  validateAdminListingBase,
  validateImageCount,
  validateImageOrder,
  type AdminListingFormErrors,
  type ImageOrderItem,
  type ImageOrderMode,
  type ListingStatus,
} from "@/lib/admin/listing-core";
import { cleanupStorageObjects, uploadListingImages } from "@/lib/admin/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  canAdminPublishListing,
  isListingVisibilityPreference,
  type ListingVisibilityPreference,
} from "@/lib/listing-visibility";

export type AdminListingFormState = {
  errors?: AdminListingFormErrors;
  message?: string;
  ok?: boolean;
};

type CurrentListingRow = {
  id: string;
  creator_id: string;
  slug: string;
  image_paths: string[] | null;
  status: ListingStatus;
  published_at: string | null;
  visibility_preference: ListingVisibilityPreference;
};

export async function createAdminListing(
  _state: AdminListingFormState,
  formData: FormData,
): Promise<AdminListingFormState> {
  await requireAdmin("/admin/listings/new");

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

  const parsed = parseListingForm(formData, imageOrder.order.length);

  if (!parsed.ok) {
    return { errors: parsed.errors };
  }

  if (
    parsed.data.status === "published" &&
    !canAdminPublishListing(parsed.data.visibilityPreference)
  ) {
    return {
      errors: { status: "크리에이터가 메인 공개를 신청하지 않은 광고 자리입니다." },
    };
  }

  const supabase = createAdminClient();
  const creator = await getAvailableCreator(parsed.data.creatorId);

  if (!creator) {
    return { errors: { creatorId: "보관되지 않은 크리에이터를 선택해주세요." } };
  }

  const listingId = crypto.randomUUID();
  const uploaded = await uploadListingImages({
    creatorId: parsed.data.creatorId,
    listingId,
    files,
  });

  if (!uploaded.ok) {
    return { errors: { images: uploaded.message } };
  }

  const finalImagePaths = buildOrderedImagePaths({
    currentImagePaths: [],
    uploadedImagePaths: uploaded.uploaded.map((image) => image.path),
    imageOrder: imageOrder.order,
  });

  const imageError = validateImageCount(parsed.data.status, finalImagePaths.length);

  if (imageError) {
    await cleanupStorageObjects(uploaded.uploaded.map((image) => image.path));
    return { errors: { images: imageError } };
  }

  const publishedAt = nextPublishedAt({
    currentPublishedAt: null,
    previousStatus: null,
    nextStatus: parsed.data.status,
    nowIso: new Date().toISOString(),
  });

  const { data, error } = await supabase
    .from("listings")
    .insert(
      buildAdminListingInsertPayload({
        input: parsed.data,
        listingId,
        imagePaths: finalImagePaths,
        publishedAt,
      }),
    )
    .select("id")
    .single();

  if (error) {
    await cleanupStorageObjects(uploaded.uploaded.map((image) => image.path));
    return {
      message: isDuplicateSlugError(error)
        ? "이미 사용 중인 slug입니다."
        : "광고 상품을 생성하지 못했습니다.",
    };
  }

  revalidateListingPaths(data.id, parsed.data.slug);
  redirect(`/admin/listings/${data.id}`);
}

export async function updateAdminListing(
  listingId: string,
  _state: AdminListingFormState,
  formData: FormData,
): Promise<AdminListingFormState> {
  await requireAdmin(`/admin/listings/${listingId}`);

  const current = await getCurrentListing(listingId);

  if (!current) {
    return { message: "광고 상품을 찾지 못했습니다." };
  }

  const currentImagePaths = current.image_paths ?? [];
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

  const parsed = parseListingForm(formData, imageOrder.order.length);

  if (!parsed.ok) {
    return { errors: parsed.errors };
  }

  if (
    parsed.data.status === "published" &&
    !canAdminPublishListing(parsed.data.visibilityPreference)
  ) {
    return {
      errors: { status: "크리에이터가 메인 공개를 신청하지 않은 광고 자리입니다." },
    };
  }

  const uploaded = await uploadListingImages({
    creatorId: current.creator_id,
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

  const publishedAt = nextPublishedAt({
    currentPublishedAt: current.published_at,
    previousStatus: current.status,
    nextStatus: parsed.data.status,
    nowIso: new Date().toISOString(),
  });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("listings")
    .update(
      buildAdminListingUpdatePayload({
        input: parsed.data,
        imagePaths: finalImagePaths,
        publishedAt,
      }),
    )
    .eq("id", listingId);

  if (error) {
    await cleanupStorageObjects(uploadedPaths);
    return {
      message: isDuplicateSlugError(error)
        ? "이미 사용 중인 slug입니다."
        : "광고 상품을 저장하지 못했습니다.",
    };
  }

  const removedExistingPaths = currentImagePaths.filter(
    (path) => !path.startsWith("/") && !finalImagePaths.includes(path),
  );
  await cleanupStorageObjects(removedExistingPaths);

  revalidateListingPaths(listingId, parsed.data.slug, current.slug);
  return { ok: true, message: "광고 상품을 저장했습니다." };
}

async function getAvailableCreator(creatorId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("creators")
    .select("id, status")
    .eq("id", creatorId)
    .neq("status", "archived")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to verify listing creator: ${error.message}`);
  }

  return data;
}

async function getCurrentListing(id: string): Promise<CurrentListingRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("listings")
    .select("id, creator_id, slug, image_paths, status, published_at, visibility_preference")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load current listing: ${error.message}`);
  }

  return data as CurrentListingRow | null;
}

function parseListingForm(formData: FormData, imageCount: number) {
  const visibilityPreference = stringValue(
    formData.get("visibilityPreference"),
  );

  if (!isListingVisibilityPreference(visibilityPreference)) {
    return {
      ok: false as const,
      errors: { status: "광고 자리 운영 방식을 선택해주세요." },
    };
  }

  const base = validateAdminListingBase({
    creatorId: stringValue(formData.get("creatorId")),
    title: stringValue(formData.get("title")),
    slug: stringValue(formData.get("slug")),
    platform: stringValue(formData.get("platform")),
    channelUrl: nullableStringValue(formData.get("channelUrl")),
    audienceSize: nullableStringValue(formData.get("audienceSize")),
    adFormat: stringValue(formData.get("adFormat")),
    deliverablesText: nullableStringValue(formData.get("deliverables")),
    priceKrw: stringValue(formData.get("priceKrw")),
    status: stringValue(formData.get("status")),
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
      isSample: formData.get("isSample") === "on",
      visibilityPreference,
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

function revalidateListingPaths(
  listingId: string,
  nextSlug?: string,
  previousSlug?: string,
) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath(`/admin/listings/${listingId}`);

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
