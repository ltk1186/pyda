"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  formatListingStatus,
  listingPlatforms,
  listingStatuses,
  type ListingPlatform,
  type ListingStatus,
} from "@/lib/admin/listing-core";
import type { CreatorListingFormState } from "@/app/creator/(manage)/listings/actions";
import { ListingImageInput } from "@/components/admin/listing-image-input";

type CreatorListingFormProps = {
  action: (
    state: CreatorListingFormState,
    formData: FormData,
  ) => Promise<CreatorListingFormState>;
  listing?: {
    title: string;
    slug: string;
    platform: ListingPlatform;
    channelName: string | null;
    channelUrl: string | null;
    audienceSize: number | null;
    adFormat: string;
    description: string | null;
    deliverables: string[];
    priceKrw: number;
    imagePaths: string[];
    status: ListingStatus;
  };
  submitLabel: string;
};

const initialState: CreatorListingFormState = {};

export function CreatorListingForm({
  action,
  listing,
  submitLabel,
}: CreatorListingFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-base font-semibold">기본 정보</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <TextField
            defaultValue={listing?.title}
            error={state.errors?.title}
            label="상품명"
            name="title"
            required
          />
          <TextField
            defaultValue={listing?.slug}
            error={state.errors?.slug}
            label="slug"
            name="slug"
            required
          />
          <div>
            <label className="text-sm font-medium text-neutral-950" htmlFor="platform">
              플랫폼
            </label>
            <select
              className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-950"
              defaultValue={listing?.platform ?? ""}
              id="platform"
              name="platform"
            >
              <option value="">선택해주세요</option>
              {listingPlatforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
            <FieldError message={state.errors?.platform} />
          </div>
          <TextField
            defaultValue={listing?.channelName ?? ""}
            label="채널명"
            name="channelName"
          />
          <TextField
            defaultValue={listing?.channelUrl ?? ""}
            error={state.errors?.channelUrl}
            label="채널 URL"
            name="channelUrl"
          />
          <TextField
            defaultValue={
              listing?.audienceSize === null || listing?.audienceSize === undefined
                ? ""
                : `${listing.audienceSize}`
            }
            error={state.errors?.audienceSize}
            label="구독자 또는 팔로워 수"
            name="audienceSize"
          />
          <TextField
            defaultValue={listing?.adFormat}
            error={state.errors?.adFormat}
            label="광고 형식"
            name="adFormat"
            required
          />
          <TextField
            defaultValue={listing ? `${listing.priceKrw}` : ""}
            error={state.errors?.priceKrw}
            label="가격"
            name="priceKrw"
            required
          />
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium text-neutral-950" htmlFor="description">
            상세 설명
          </label>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-950"
            defaultValue={listing?.description ?? ""}
            id="description"
            name="description"
          />
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium text-neutral-950" htmlFor="deliverables">
            제공 내용
          </label>
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-950"
            defaultValue={listing?.deliverables.join("\n") ?? ""}
            id="deliverables"
            name="deliverables"
            placeholder="한 줄에 하나씩 입력"
          />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <ListingImageInput
          defaultImagePaths={listing?.imagePaths ?? []}
          error={state.errors?.images}
        />
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-base font-semibold">공개 상태</h2>
        <div className="mt-5 max-w-sm">
          <label className="text-sm font-medium text-neutral-950" htmlFor="status">
            상태
          </label>
          <select
            className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-950"
            defaultValue={listing?.status ?? "draft"}
            id="status"
            name="status"
          >
            {listingStatuses.map((status) => (
              <option key={status} value={status}>
                {formatListingStatus(status)}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.status} />
        </div>
      </section>

      {state.message ? (
        <p
          className={`text-sm ${state.ok ? "text-neutral-600" : "text-red-700"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton label={submitLabel} />
    </form>
  );
}

function TextField({
  defaultValue,
  error,
  label,
  name,
  required = false,
}: {
  defaultValue?: string;
  error?: string;
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-neutral-950" htmlFor={name}>
        {label}
      </label>
      <input
        className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-950"
        defaultValue={defaultValue ?? ""}
        id={name}
        name={name}
        required={required}
        type="text"
      />
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-red-700">{message}</p>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "저장 중" : label}
    </button>
  );
}
