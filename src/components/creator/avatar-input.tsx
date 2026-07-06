"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { allowedImageMimeTypes } from "@/lib/admin/listing-core";
import { maxAvatarImageSide } from "@/lib/creator/core";
import { resolveImagePath } from "@/lib/images";

type AvatarInputProps = {
  defaultAvatarPath: string | null;
  error?: string;
};

export function AvatarInput({ defaultAvatarPath, error }: AvatarInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    defaultAvatarPath ? resolveImagePath(defaultAvatarPath) : null,
  );
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!allowedImageMimeTypes.includes(file.type as never)) {
      setMessage("JPEG, PNG, WebP 이미지만 선택할 수 있습니다.");
      return;
    }

    const resized = await resizeAvatar(file);
    const transfer = new DataTransfer();
    transfer.items.add(resized);

    if (fileInputRef.current) {
      fileInputRef.current.files = transfer.files;
    }

    setRemoveAvatar(false);
    setMessage(null);
    setPreviewUrl(URL.createObjectURL(resized));
  }

  function removeCurrentAvatar() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setPreviewUrl(null);
    setRemoveAvatar(true);
  }

  return (
    <div>
      <p className="text-sm font-medium text-neutral-950">아바타</p>
      <p className="mt-1 text-xs text-neutral-500">
        한 장만 사용합니다. 업로드 전 긴 변을 약 1200px로 줄입니다.
      </p>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-neutral-100">
          {previewUrl ? (
            <Image
              alt="크리에이터 아바타"
              className="object-cover"
              fill
              src={previewUrl}
              unoptimized
            />
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50">
            이미지 선택
            <input
              accept={allowedImageMimeTypes.join(",")}
              className="sr-only"
              name="avatarImage"
              onChange={(event) => {
                void handleFile(event.currentTarget.files?.[0]);
              }}
              ref={fileInputRef}
              type="file"
            />
          </label>
          <button
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-red-700 hover:bg-neutral-50"
            onClick={removeCurrentAvatar}
            type="button"
          >
            아바타 제거
          </button>
        </div>
      </div>

      {removeAvatar ? <input name="removeAvatar" type="hidden" value="on" /> : null}

      {message || error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {message ?? error}
        </p>
      ) : null}
    </div>
  );
}

async function resizeAvatar(file: File) {
  const image = await createImageBitmap(file);
  const scale = Math.min(
    1,
    maxAvatarImageSide / Math.max(image.width, image.height),
  );
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    return file;
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, file.type, file.type === "image/png" ? undefined : 0.86);
  });

  if (!blob) {
    return file;
  }

  return new File([blob], file.name, { type: file.type });
}
