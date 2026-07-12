"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AdvertiseFormState } from "@/app/advertise/actions";
import {
  customAdBudgetLabels,
  customAdBudgetRanges,
  customAdContactMethodLabels,
  customAdContactMethods,
  customAdDesiredTimings,
  customAdTimingLabels,
} from "@/lib/custom-ad-requests/core";

type CustomAdRequestFormProps = {
  action: (
    state: AdvertiseFormState,
    formData: FormData,
  ) => Promise<AdvertiseFormState>;
  source: string;
};

const initialState: AdvertiseFormState = {};

export function CustomAdRequestForm({ action, source }: CustomAdRequestFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  if (state.success) {
    return <AdvertiseSuccess success={state.success} />;
  }

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <input name="source" type="hidden" value={source} />

      <TextField
        error={state.errors?.advertisedItem}
        helper="매장, 상품 또는 서비스 이름을 적어주세요."
        label="무엇을 광고하고 싶나요?"
        name="advertisedItem"
        placeholder="제주 애월의 작은 카페"
        required
      />

      <TextAreaField
        error={state.errors?.requestDetails}
        helper="어디에서, 어떤 방식으로 소개되면 좋은지 자유롭게 적어주세요."
        label="어떤 광고를 원하시나요?"
        name="requestDetails"
        placeholder="제주 여행 유튜버가 영상 안에서 카페를 30초 정도 소개했으면 합니다."
        required
      />

      <TextAreaField
        error={state.errors?.creatorPreferences}
        helper="없으면 비워두세요. Pyda가 조건을 보고 찾아봅니다."
        label="원하는 크리에이터 조건이 있나요?"
        name="creatorPreferences"
        placeholder="제주 여행 콘텐츠, YouTube, 20~30대 시청자"
      />

      <SelectField
        error={state.errors?.budgetRange}
        label="예상 예산"
        name="budgetRange"
        options={customAdBudgetRanges.map((value) => ({
          label: customAdBudgetLabels[value],
          value,
        }))}
        required
      />

      <SelectField
        error={state.errors?.desiredTiming}
        label="언제쯤 진행하고 싶나요?"
        name="desiredTiming"
        options={customAdDesiredTimings.map((value) => ({
          label: customAdTimingLabels[value],
          value,
        }))}
        required
      />

      <SelectField
        error={state.errors?.contactMethod}
        label="연락 방법"
        name="contactMethod"
        options={customAdContactMethods.map((value) => ({
          label: customAdContactMethodLabels[value],
          value,
        }))}
        required
      />

      <TextField
        error={state.errors?.phone}
        label="휴대전화번호"
        name="phone"
        placeholder="010-1234-5678"
        required
        type="tel"
      />

      <div>
        <label className="flex items-start gap-3 text-sm leading-6 text-neutral-700">
          <input
            className="mt-1 h-4 w-4 rounded border-neutral-300"
            name="privacyConsent"
            required
            type="checkbox"
          />
          <span>문의 답변과 크리에이터 연결을 위한 연락처 수집에 동의합니다.</span>
        </label>
        <FieldError message={state.errors?.privacyConsent} />
      </div>

      {state.message ? (
        <p
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

export function AdvertiseSuccess({
  success,
}: {
  success: NonNullable<AdvertiseFormState["success"]>;
}) {
  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
      <h2 className="text-2xl font-semibold tracking-tight">
        광고 요청을 받았습니다.
      </h2>
      <p className="mt-3 text-sm leading-6 text-neutral-600">
        조건에 맞는 크리에이터를 직접 찾아보고 연락드리겠습니다.
      </p>
      <ol className="mt-5 space-y-2 text-sm leading-6 text-neutral-700">
        <li>1. 남겨주신 조건을 확인하고 영업일 2일 안에 먼저 연락드립니다.</li>
        <li>2. 조건에 맞는 크리에이터 후보를 찾고 가능 여부를 확인합니다.</li>
        <li>3. 확인되는 대로 예상 견적을 남겨주신 연락처로 안내드립니다.</li>
      </ol>

      {success.contactMethod === "kakao" && success.openChatUrl ? (
        <div className="mt-5">
          <p className="text-sm leading-6 text-neutral-600">
            빠르게 이야기하고 싶다면 카카오톡으로 바로 문의해주세요.
          </p>
          <a
            className="mt-4 inline-flex rounded-full bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            href={success.openChatUrl}
            rel="noreferrer"
            target="_blank"
          >
            카카오톡으로 바로 이야기하기
          </a>
        </div>
      ) : success.contactMethod === "kakao" ? (
        <p className="mt-5 text-sm leading-6 text-neutral-600">
          남겨주신 번호로 연락드릴게요.
        </p>
      ) : (
        <p className="mt-5 text-sm leading-6 text-neutral-600">
          전화로 연락드릴게요.
        </p>
      )}
    </section>
  );
}

type TextFieldProps = {
  error?: string;
  helper?: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
};

function TextField({
  error,
  helper,
  label,
  name,
  placeholder,
  required = false,
  type = "text",
}: TextFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-neutral-950" htmlFor={name}>
        {label}
      </label>
      {helper ? (
        <p className="mt-1 text-sm leading-6 text-neutral-500">{helper}</p>
      ) : null}
      <input
        className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
        id={name}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
      <FieldError message={error} />
    </div>
  );
}

function TextAreaField({
  error,
  helper,
  label,
  name,
  placeholder,
  required = false,
}: Omit<TextFieldProps, "type">) {
  return (
    <div>
      <label className="text-sm font-medium text-neutral-950" htmlFor={name}>
        {label}
      </label>
      {helper ? (
        <p className="mt-1 text-sm leading-6 text-neutral-500">{helper}</p>
      ) : null}
      <textarea
        className="mt-2 min-h-28 w-full resize-y rounded-md border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
        id={name}
        name={name}
        placeholder={placeholder}
        required={required}
      />
      <FieldError message={error} />
    </div>
  );
}

function SelectField({
  error,
  label,
  name,
  options,
  required,
}: {
  error?: string;
  label: string;
  name: string;
  options: Array<{ label: string; value: string }>;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-neutral-950" htmlFor={name}>
        {label}
      </label>
      <select
        className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-3 text-sm outline-none focus:border-neutral-950"
        id={name}
        name={name}
        required={required}
      >
        <option value="">선택해주세요</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-sm text-red-600" role="alert">
      {message}
    </p>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="w-full rounded-md bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "제출 중" : "문의 남기기"}
    </button>
  );
}
