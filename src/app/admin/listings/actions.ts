"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  assertExistingImageSubset,
  buildAdminListingInsertPayload,
  buildAdminListingUpdatePayload,
  maxListingImages,
  nextPublishedAt,
  validateAdminListingBase,
  validateImageCount,
  type AdminListingFormErrors,
  type ListingStatus,
} from "@/lib/admin/listing-core";
import { cleanupStorageObjects, uploadListingImages } from "@/lib/admin/storage";
import { createAdminClient } from "@/lib/supabase/admin";

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
};

export async function createAdminListing(
  _state: AdminListingFormState,
  formData: FormData,
): Promise<AdminListingFormState> {
  await requireAdmin("/admin/listings/new");

  const files = getImageFiles(formData);
  const imageOrder = getImageOrder(formData, [], files.length);
  const parsed = parseListingForm(formData, imageOrder.length);

  if (!parsed.ok) {
    return { errors: parsed.errors };
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
    imageOrder,
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
  const imageOrder = getImageOrder(formData, currentImagePaths, files.length);
  const requestedExistingPaths = imageOrder
    .filter((item) => item.kind === "existing")
    .map((item) => item.path);

  if (!assertExistingImageSubset(currentImagePaths, requestedExistingPaths)) {
    return { errors: { images: "현재 상품에 연결된 기존 이미지만 유지할 수 있습니다." } };
  }

  const parsed = parseListingForm(formData, imageOrder.length);

  if (!parsed.ok) {
    return { errors: parsed.errors };
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
    imageOrder,
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
    .select("id, creator_id, slug, image_paths, status, published_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load current listing: ${error.message}`);
  }

  return data as CurrentListingRow | null;
}

function parseListingForm(formData: FormData, imageCount: number) {
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

type ImageOrderItem =
  | {
      kind: "existing";
      path: string;
    }
  | {
      kind: "new";
      index: number;
    };

function getImageOrder(
  formData: FormData,
  currentImagePaths: string[],
  newImageCount: number,
) {
  const rawOrder = formData
    .getAll("imageOrder")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);

  const order =
    rawOrder.length > 0
      ? rawOrder.map(parseImageOrderItem).filter((item): item is ImageOrderItem => item !== null)
      : [
          ...currentImagePaths.map((path) => ({ kind: "existing" as const, path })),
          ...Array.from({ length: newImageCount }, (_, index) => ({
            kind: "new" as const,
            index,
          })),
        ];

  return order.slice(0, maxListingImages + 1);
}

function parseImageOrderItem(value: string): ImageOrderItem | null {
  if (value.startsWith("existing:")) {
    return { kind: "existing", path: value.slice("existing:".length) };
  }

  if (value.startsWith("new:")) {
    const index = Number(value.slice("new:".length));

    if (Number.isInteger(index) && index >= 0) {
      return { kind: "new", index };
    }
  }

  return null;
}

function buildOrderedImagePaths(params: {
  currentImagePaths: string[];
  uploadedImagePaths: string[];
  imageOrder: ImageOrderItem[];
}) {
  return params.imageOrder.flatMap((item) => {
    if (item.kind === "existing") {
      return params.currentImagePaths.includes(item.path) ? [item.path] : [];
    }

    const uploadedPath = params.uploadedImagePaths[item.index];
    return uploadedPath ? [uploadedPath] : [];
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
