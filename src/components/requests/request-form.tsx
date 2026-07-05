"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { contactChannels } from "@/lib/requests";
import type { RequestFormState } from "@/app/listings/[slug]/actions";

type RequestFormProps = {
  action: (
    state: RequestFormState,
    formData: FormData,
  ) => Promise<RequestFormState>;
};

const initialState: RequestFormState = {};

export function RequestForm({ action }: RequestFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="rounded-lg border border-neutral-200 bg-white p-5"
    >
      <div>
        <p className="text-base font-semibold text-neutral-950">
          광고 요청을 남겨주세요.
        </p>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          제출 후 관리자가 광고 상품과 일정을 확인해 직접 연락드립니다.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        <TextField
          error={state.errors?.brandName}
          label="회사 또는 브랜드명"
          name="brandName"
          required
        />
        <TextField
          error={state.errors?.contactName}
          label="담당자명"
          name="contactName"
          required
        />

        <div>
          <label
            className="text-sm font-medium text-neutral-950"
            htmlFor="contactChannel"
          >
            선호 연락 방식
          </label>
          <select
            className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-3 text-sm outline-none focus:border-neutral-950"
            id="contactChannel"
            name="contactChannel"
            required
          >
            <option value="">선택해주세요</option>
            {contactChannels.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.contactChannel} />
        </div>

        <TextField
          error={state.errors?.contactValue}
          label="연락처"
          name="contactValue"
          required
        />

        <div>
          <label
            className="text-sm font-medium text-neutral-950"
            htmlFor="campaignBrief"
          >
            어떤 광고를 진행하고 싶으신가요?
          </label>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-md border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
            id="campaignBrief"
            name="campaignBrief"
            required
          />
          <FieldError message={state.errors?.campaignBrief} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            error={state.errors?.preferredStartDate}
            label="희망 시작일"
            name="preferredStartDate"
            type="date"
          />
          <TextField
            error={state.errors?.preferredEndDate}
            label="희망 종료일"
            name="preferredEndDate"
            type="date"
          />
        </div>
      </div>

      {state.message ? (
        <p className="mt-5 text-sm text-neutral-600" role="alert">
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

type TextFieldProps = {
  error?: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
};

function TextField({
  error,
  label,
  name,
  required = false,
  type = "text",
}: TextFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-neutral-950" htmlFor={name}>
        {label}
      </label>
      <input
        className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
        id={name}
        name={name}
        required={required}
        type={type}
      />
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-neutral-600">{message}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="mt-6 w-full rounded-md bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "제출 중" : "광고 요청 제출"}
    </button>
  );
}
