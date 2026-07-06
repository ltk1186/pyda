"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  creatorStatuses,
  formatCreatorStatus,
  type CreatorSocialLinks,
  type CreatorStatus,
} from "@/lib/admin/creator-core";
import type { AdminCreatorFormState } from "@/app/admin/creators/actions";

type AdminCreatorFormProps = {
  action: (
    state: AdminCreatorFormState,
    formData: FormData,
  ) => Promise<AdminCreatorFormState>;
  creator?: {
    displayName: string;
    slug: string;
    bio: string | null;
    socialLinks: CreatorSocialLinks;
    status: CreatorStatus;
    isSample: boolean;
  };
  submitLabel: string;
};

const initialState: AdminCreatorFormState = {};

export function AdminCreatorForm({
  action,
  creator,
  submitLabel,
}: AdminCreatorFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-base font-semibold">기본 정보</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <TextField
            defaultValue={creator?.displayName}
            error={state.errors?.displayName}
            label="활동명"
            name="displayName"
            required
          />
          <TextField
            defaultValue={creator?.slug}
            error={state.errors?.slug}
            label="slug"
            name="slug"
            required
          />
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium text-neutral-950" htmlFor="bio">
            소개
          </label>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-950"
            defaultValue={creator?.bio ?? ""}
            id="bio"
            name="bio"
          />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-base font-semibold">Social links</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <TextField
            defaultValue={creator?.socialLinks.youtube}
            error={state.errors?.youtube}
            label="YouTube URL"
            name="youtube"
          />
          <TextField
            defaultValue={creator?.socialLinks.instagram}
            error={state.errors?.instagram}
            label="Instagram URL"
            name="instagram"
          />
          <TextField
            defaultValue={creator?.socialLinks.blog}
            error={state.errors?.blog}
            label="네이버 블로그 URL"
            name="blog"
          />
          <TextField
            defaultValue={creator?.socialLinks.tiktok}
            error={state.errors?.tiktok}
            label="TikTok URL"
            name="tiktok"
          />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-base font-semibold">운영 상태</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label
              className="text-sm font-medium text-neutral-950"
              htmlFor="status"
            >
              공개 상태
            </label>
            <select
              className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-950"
              defaultValue={creator?.status ?? "draft"}
              id="status"
              name="status"
            >
              {creatorStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatCreatorStatus(status)}
                </option>
              ))}
            </select>
            <FieldError message={state.errors?.status} />
          </div>

          <label className="flex items-center gap-3 self-end rounded-md border border-neutral-200 px-3 py-2 text-sm">
            <input
              className="h-4 w-4"
              defaultChecked={creator?.isSample ?? false}
              name="isSample"
              type="checkbox"
            />
            예시 크리에이터
          </label>
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
