"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  allowedImageMimeTypes,
  maxListingImages,
} from "@/lib/admin/listing-core";
import { resolveImagePath } from "@/lib/images";

type ImageItem =
  | {
      id: string;
      kind: "existing";
      path: string;
      previewUrl: string;
    }
  | {
      id: string;
      kind: "new";
      file: File;
      previewUrl: string;
    };

type ListingImageInputProps = {
  defaultImagePaths?: string[];
  error?: string;
};

const maxImageSide = 1600;

export function ListingImageInput({
  defaultImagePaths = [],
  error,
}: ListingImageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ImageItem[]>(() =>
    defaultImagePaths.map((path) => ({
      id: `existing:${path}`,
      kind: "existing",
      path,
      previewUrl: resolveImagePath(path),
    })),
  );
  const [message, setMessage] = useState<string | null>(null);

  const newItems = useMemo(
    () => items.filter((item): item is Extract<ImageItem, { kind: "new" }> => item.kind === "new"),
    [items],
  );

  useEffect(() => {
    const transfer = new DataTransfer();

    for (const item of newItems) {
      transfer.items.add(item.file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.files = transfer.files;
    }
  }, [newItems]);

  async function handleFiles(files: FileList | null) {
    if (!files) {
      return;
    }

    const incoming = Array.from(files);

    if (items.length + incoming.length > maxListingImages) {
      setMessage("이미지는 최대 3장까지 등록할 수 있습니다.");
      return;
    }

    const processed: ImageItem[] = [];

    for (const file of incoming) {
      if (!allowedImageMimeTypes.includes(file.type as never)) {
        setMessage("JPEG, PNG, WebP 이미지만 선택할 수 있습니다.");
        return;
      }

      const resized = await resizeImage(file);
      processed.push({
        id: `new:${crypto.randomUUID()}`,
        kind: "new",
        file: resized,
        previewUrl: URL.createObjectURL(resized),
      });
    }

    setMessage(null);
    setItems((current) => [...current, ...processed].slice(0, maxListingImages));
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function moveItem(id: string, direction: -1 | 1) {
    setItems((current) => {
      const index = current.findIndex((item) => item.id === id);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  function orderValue(item: ImageItem) {
    if (item.kind === "existing") {
      return `existing:${item.path}`;
    }

    return `new:${newItems.findIndex((newItem) => newItem.id === item.id)}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-950">이미지</p>
          <p className="mt-1 text-xs text-neutral-500">
            첫 번째 이미지가 대표 이미지입니다. 최대 3장까지 등록합니다.
          </p>
        </div>
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50">
          이미지 선택
          <input
            accept={allowedImageMimeTypes.join(",")}
            className="sr-only"
            multiple
            onChange={(event) => {
              void handleFiles(event.target.files);
              event.currentTarget.value = "";
            }}
            type="file"
          />
        </label>
      </div>

      <input className="sr-only" multiple name="newImages" ref={fileInputRef} type="file" />
      {items.map((item) => (
        <input key={item.id} name="imageOrder" type="hidden" value={orderValue(item)} />
      ))}

      {items.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {items.map((item, index) => (
            <div className="rounded-lg border border-neutral-200 p-2" key={item.id}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-neutral-100">
                <Image
                  alt={`광고 상품 이미지 ${index + 1}`}
                  className="object-cover"
                  fill
                  src={item.previewUrl}
                  unoptimized
                />
              </div>
              <p className="mt-2 text-xs font-medium text-neutral-600">
                {index === 0 ? "대표 이미지" : `이미지 ${index + 1}`}
              </p>
              <div className="mt-2 flex gap-2 text-xs">
                <button
                  className="rounded border border-neutral-300 px-2 py-1 disabled:text-neutral-300"
                  disabled={index === 0}
                  onClick={() => moveItem(item.id, -1)}
                  type="button"
                >
                  앞으로
                </button>
                <button
                  className="rounded border border-neutral-300 px-2 py-1 disabled:text-neutral-300"
                  disabled={index === items.length - 1}
                  onClick={() => moveItem(item.id, 1)}
                  type="button"
                >
                  뒤로
                </button>
                <button
                  className="rounded border border-neutral-300 px-2 py-1 text-red-700"
                  onClick={() => removeItem(item.id)}
                  type="button"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-neutral-300 p-5 text-sm text-neutral-500">
          선택된 이미지가 없습니다.
        </div>
      )}

      {message || error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {message ?? error}
        </p>
      ) : null}
    </div>
  );
}

async function resizeImage(file: File) {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, maxImageSide / Math.max(image.width, image.height));
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
