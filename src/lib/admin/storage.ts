import "server-only";

import {
  buildStorageObjectPath,
  getExtensionForMimeType,
  validateImageFile,
} from "@/lib/admin/listing-core";
import {
  buildAvatarStorageObjectPath,
  getAvatarExtensionForMimeType,
  validateAvatarFile,
} from "@/lib/creator/core";
import { publicMediaBucket } from "@/lib/images";
import { createAdminClient } from "@/lib/supabase/admin";

export type UploadedAdminImage = {
  path: string;
};

export async function uploadListingImages(params: {
  creatorId: string;
  listingId: string;
  files: File[];
}) {
  const supabase = createAdminClient();
  const uploaded: UploadedAdminImage[] = [];

  for (const file of params.files) {
    const validationError = validateImageFile(file);

    if (validationError) {
      await cleanupStorageObjects(uploaded.map((item) => item.path));
      return {
        ok: false as const,
        message: validationError,
        uploadedPaths: uploaded.map((item) => item.path),
      };
    }

    const extension = getExtensionForMimeType(file.type);

    if (!extension) {
      await cleanupStorageObjects(uploaded.map((item) => item.path));
      return {
        ok: false as const,
        message: "지원하지 않는 이미지 형식입니다.",
        uploadedPaths: uploaded.map((item) => item.path),
      };
    }

    const path = buildStorageObjectPath({
      creatorId: params.creatorId,
      listingId: params.listingId,
      extension,
      randomId: crypto.randomUUID(),
    });

    const { error } = await supabase.storage
      .from(publicMediaBucket)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      await cleanupStorageObjects(uploaded.map((item) => item.path));
      return {
        ok: false as const,
        message: "이미지를 업로드하지 못했습니다.",
        uploadedPaths: uploaded.map((item) => item.path),
      };
    }

    uploaded.push({ path });
  }

  return {
    ok: true as const,
    uploaded,
  };
}

export async function cleanupStorageObjects(paths: string[]) {
  const storagePaths = paths.filter((path) => !path.startsWith("/"));

  if (storagePaths.length === 0) {
    return;
  }

  const supabase = createAdminClient();
  await supabase.storage.from(publicMediaBucket).remove(storagePaths);
}

export async function uploadAvatarImage(params: {
  creatorId: string;
  file: File;
}) {
  const validationError = validateAvatarFile(params.file);

  if (validationError) {
    return {
      ok: false as const,
      message: validationError,
    };
  }

  const extension = getAvatarExtensionForMimeType(params.file.type);

  if (!extension) {
    return {
      ok: false as const,
      message: "지원하지 않는 이미지 형식입니다.",
    };
  }

  const path = buildAvatarStorageObjectPath({
    creatorId: params.creatorId,
    extension,
    randomId: crypto.randomUUID(),
  });
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(publicMediaBucket)
    .upload(path, params.file, {
      contentType: params.file.type,
      upsert: false,
    });

  if (error) {
    return {
      ok: false as const,
      message: "아바타 이미지를 업로드하지 못했습니다.",
    };
  }

  return {
    ok: true as const,
    path,
  };
}
