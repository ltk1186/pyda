"use client";

import type { ReactNode } from "react";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import type { AdvertiseFormState } from "@/app/advertise/actions";
import {
  customAdBudgetLabels,
  customAdBudgetRanges,
  customAdContactMethodLabels,
  customAdContactMethods,
  customAdDesiredTimings,
  customAdTimingLabels,
  type CustomAdBudgetRange,
} from "@/lib/custom-ad-requests/core";

type CustomAdRequestFormProps = {
  action: (
    state: AdvertiseFormState,
    formData: FormData,
  ) => Promise<AdvertiseFormState>;
  source: string;
};

type RequestOption = {
  label: string;
  value: string;
};

const initialState: AdvertiseFormState = {};
const totalSteps = 6;

const requestOptions: RequestOption[] = [
  { label: "유튜브 영상 안에서 소개", value: "유튜브 영상 안에서 소개" },
  { label: "인스타그램 릴스나 게시물", value: "인스타그램 릴스나 게시물" },
  { label: "블로그 리뷰", value: "블로그 리뷰" },
  {
    label: "잘 모르겠어요. 추천받고 싶어요.",
    value: "잘 모르겠어요. 추천받고 싶어요.",
  },
];

const creatorPreferenceOptions = [
  "제주 여행 콘텐츠",
  "제주 맛집 콘텐츠",
  "인스타그램 중심",
  "유튜브 중심",
  "조건 없음",
];

const budgetHints: Record<CustomAdBudgetRange, string> = {
  under_50k:
    "소규모 인스타그램 스토리, 간단한 게시물, 제품 제공 협찬 중심으로 가능성을 확인해볼 수 있습니다.",
  "50k_100k":
    "인스타그램 게시물, 스토리, 소규모 블로그 리뷰 중심으로 확인해볼 수 있습니다.",
  "100k_300k":
    "마이크로 크리에이터의 인스타 릴스, 쇼츠, 블로그 리뷰, 짧은 콘텐츠 협업을 우선 확인해볼 수 있습니다.",
  "300k_500k":
    "유튜브 쇼츠, 인스타 릴스, 영상 내 짧은 소개, 블로그 리뷰 패키지 등을 확인해볼 수 있습니다.",
  "500k_1m":
    "유튜브 영상 내 소개, 릴스와 쇼츠 조합, 복수 콘텐츠 협업을 확인해볼 수 있습니다.",
  over_1m:
    "복수 크리에이터 패키지, 유튜브 영상 소개, 숏폼 조합 캠페인 등을 확인해볼 수 있습니다.",
  unknown:
    "예산을 잘 모르셔도 괜찮습니다. 업종과 목적에 맞춰 가능한 범위를 먼저 확인해보겠습니다.",
};

export function CustomAdRequestForm({
  action,
  source,
}: CustomAdRequestFormProps) {
  const [step, setStep] = useState(0);
  const [state, formAction] = useActionState(
    async (currentState: AdvertiseFormState, formData: FormData) => {
      const nextState = await action(currentState, formData);

      if (nextState.errors) {
        setStep(getErrorStep(nextState.errors));
      }

      return nextState;
    },
    initialState,
  );
  const [advertisedItem, setAdvertisedItem] = useState("");
  const [requestOption, setRequestOption] = useState("");
  const [requestDetailsText, setRequestDetailsText] = useState("");
  const [creatorPreferences, setCreatorPreferences] = useState<string[]>([]);
  const [creatorPreferencesText, setCreatorPreferencesText] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [desiredTiming, setDesiredTiming] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [phone, setPhone] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const requestDetails = useMemo(
    () => composeRequestDetails(requestOption, requestDetailsText),
    [requestOption, requestDetailsText],
  );
  const creatorPreferencesValue = useMemo(
    () => composeCreatorPreferences(creatorPreferences, creatorPreferencesText),
    [creatorPreferences, creatorPreferencesText],
  );

  if (state.success) {
    return <AdvertiseSuccess success={state.success} />;
  }

  const nextDisabled = isNextDisabled({
    advertisedItem,
    budgetRange,
    contactMethod,
    desiredTiming,
    phone,
    privacyConsent,
    requestDetails,
    step,
  });

  return (
    <form
      action={formAction}
      className="mt-8"
      onSubmit={(event) => {
        if (step < totalSteps - 1) {
          event.preventDefault();
        }
      }}
    >
      <input name="advertisedItem" type="hidden" value={advertisedItem} />
      <input name="requestDetails" type="hidden" value={requestDetails} />
      <input
        name="creatorPreferences"
        type="hidden"
        value={creatorPreferencesValue}
      />
      <input name="budgetRange" type="hidden" value={budgetRange} />
      <input name="desiredTiming" type="hidden" value={desiredTiming} />
      <input name="contactMethod" type="hidden" value={contactMethod} />
      <input name="phone" type="hidden" value={phone} />
      <input name="source" type="hidden" value={source} />
      {privacyConsent ? (
        <input name="privacyConsent" type="hidden" value="on" />
      ) : null}

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.05)] sm:p-7">
        <div className="mb-7">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>
              {step + 1} / {totalSteps}
            </span>
            <span>견적 문의</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-neutral-950 transition-all"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {step === 0 ? (
          <StepShell
            description="매장, 상품 또는 서비스 이름을 적어주세요."
            title="무엇을 광고하고 싶으신가요?"
          >
            <TextField
              error={state.errors?.advertisedItem}
              label="광고 대상"
              onChange={setAdvertisedItem}
              placeholder="제주 애월의 작은 카페"
              value={advertisedItem}
            />
          </StepShell>
        ) : null}

        {step === 1 ? (
          <StepShell
            description="정확히 몰라도 괜찮습니다. 원하는 느낌만 적어주세요."
            title="어떤 방식으로 소개되면 좋을까요?"
          >
            <ChoiceGrid>
              {requestOptions.map((option) => (
                <ChoiceButton
                  active={requestOption === option.value}
                  key={option.value}
                  onClick={() => setRequestOption(option.value)}
                >
                  {option.label}
                </ChoiceButton>
              ))}
            </ChoiceGrid>
            <TextAreaField
              error={state.errors?.requestDetails}
              label="추가 내용"
              onChange={setRequestDetailsText}
              placeholder="제주 여행 유튜버가 영상 안에서 카페를 30초 정도 소개했으면 합니다."
              value={requestDetailsText}
            />
          </StepShell>
        ) : null}

        {step === 2 ? (
          <StepShell
            description="없으면 건너뛰어도 됩니다. Pyda가 조건을 보고 찾아봅니다."
            title="원하는 크리에이터 조건이 있나요?"
          >
            <ChoiceGrid>
              {creatorPreferenceOptions.map((option) => (
                <ChoiceButton
                  active={creatorPreferences.includes(option)}
                  key={option}
                  onClick={() =>
                    setCreatorPreferences((current) =>
                      toggleCreatorPreference(current, option),
                    )
                  }
                >
                  {option}
                </ChoiceButton>
              ))}
            </ChoiceGrid>
            <TextAreaField
              error={state.errors?.creatorPreferences}
              label="추가 조건"
              onChange={setCreatorPreferencesText}
              placeholder="20~30대 여행객이 많이 보는 크리에이터면 좋겠습니다."
              value={creatorPreferencesText}
            />
          </StepShell>
        ) : null}

        {step === 3 ? (
          <StepShell
            description="예산에 따라 확인할 수 있는 광고 방식이 달라질 수 있습니다."
            title="어느 정도 예산으로 먼저 알아볼까요?"
          >
            <ChoiceGrid>
              {customAdBudgetRanges.map((value) => (
                <ChoiceButton
                  active={budgetRange === value}
                  key={value}
                  onClick={() => setBudgetRange(value)}
                >
                  {customAdBudgetLabels[value]}
                </ChoiceButton>
              ))}
            </ChoiceGrid>
            {budgetRange ? (
              <p className="mt-5 rounded-2xl bg-neutral-50 p-4 text-sm leading-6 text-neutral-600">
                {budgetHints[budgetRange as CustomAdBudgetRange]}
              </p>
            ) : null}
            <FieldError message={state.errors?.budgetRange} />
          </StepShell>
        ) : null}

        {step === 4 ? (
          <StepShell
            description="정확한 일정이 없어도 괜찮습니다."
            title="언제쯤 진행을 생각하고 계신가요?"
          >
            <ChoiceGrid>
              {customAdDesiredTimings.map((value) => (
                <ChoiceButton
                  active={desiredTiming === value}
                  key={value}
                  onClick={() => setDesiredTiming(value)}
                >
                  {customAdTimingLabels[value]}
                </ChoiceButton>
              ))}
            </ChoiceGrid>
            <FieldError message={state.errors?.desiredTiming} />
          </StepShell>
        ) : null}

        {step === 5 ? (
          <StepShell
            description="카카오톡을 선택해도 휴대전화번호를 함께 남겨주세요."
            title="견적 확인 결과를 어디로 보내드릴까요?"
          >
            <ChoiceGrid>
              {customAdContactMethods.map((value) => (
                <ChoiceButton
                  active={contactMethod === value}
                  key={value}
                  onClick={() => setContactMethod(value)}
                >
                  {customAdContactMethodLabels[value]}
                </ChoiceButton>
              ))}
            </ChoiceGrid>
            <FieldError message={state.errors?.contactMethod} />
            <TextField
              error={state.errors?.phone}
              label="휴대전화번호"
              onChange={setPhone}
              placeholder="010-1234-5678"
              type="tel"
              value={phone}
            />
            <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-neutral-700">
              <input
                checked={privacyConsent}
                className="mt-1 h-4 w-4 rounded border-neutral-300"
                onChange={(event) => setPrivacyConsent(event.target.checked)}
                type="checkbox"
              />
              <span>
                문의 답변과 크리에이터 연결을 위한 연락처 수집에 동의합니다.
              </span>
            </label>
            <FieldError message={state.errors?.privacyConsent} />
          </StepShell>
        ) : null}

        {state.message ? (
          <p
            className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            type="button"
          >
            이전
          </button>
          {step < totalSteps - 1 ? (
            <button
              className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
              disabled={nextDisabled}
              onClick={() =>
                setStep((current) => Math.min(totalSteps - 1, current + 1))
              }
              type="button"
            >
              다음
            </button>
          ) : (
            <SubmitButton disabled={nextDisabled} />
          )}
        </div>
      </section>
    </form>
  );
}

function StepShell({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-balance">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-neutral-600">{description}</p>
      <div className="mt-7 space-y-5">{children}</div>
    </div>
  );
}

function ChoiceGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-2 sm:grid-cols-2">{children}</div>;
}

function ChoiceButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
        active
          ? "border-neutral-950 bg-neutral-950 text-white"
          : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
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

function TextField({
  error,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-neutral-950">
        {label}
        <input
          className="mt-2 block w-full rounded-xl border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          value={value}
        />
      </label>
      <FieldError message={error} />
    </div>
  );
}

function TextAreaField({
  error,
  label,
  onChange,
  placeholder,
  value,
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-neutral-950">
        {label}
        <textarea
          className="mt-2 block min-h-28 w-full resize-y rounded-xl border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      </label>
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

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
      disabled={pending || disabled}
      type="submit"
    >
      {pending ? "제출 중" : "제출하기"}
    </button>
  );
}

function composeRequestDetails(option: string, text: string) {
  const trimmedOption = option.trim();
  const trimmedText = text.trim();

  if (trimmedOption && trimmedText) {
    return `희망 방식: ${trimmedOption}\n추가 내용: ${trimmedText}`;
  }

  return trimmedText || trimmedOption;
}

function composeCreatorPreferences(options: string[], text: string) {
  const normalizedOptions = options.filter((option) => option !== "조건 없음");
  const trimmedText = text.trim();

  if (normalizedOptions.length > 0 && trimmedText) {
    return `선호 조건: ${normalizedOptions.join(", ")}\n추가 조건: ${trimmedText}`;
  }

  if (normalizedOptions.length > 0) {
    return normalizedOptions.join(", ");
  }

  return trimmedText;
}

function toggleCreatorPreference(current: string[], option: string) {
  if (option === "조건 없음") {
    return current.includes(option) ? [] : [option];
  }

  const withoutNone = current.filter((value) => value !== "조건 없음");

  return withoutNone.includes(option)
    ? withoutNone.filter((value) => value !== option)
    : [...withoutNone, option];
}

function isNextDisabled(input: {
  advertisedItem: string;
  budgetRange: string;
  contactMethod: string;
  desiredTiming: string;
  phone: string;
  privacyConsent: boolean;
  requestDetails: string;
  step: number;
}) {
  if (input.step === 0) {
    return input.advertisedItem.trim().length === 0;
  }

  if (input.step === 1) {
    return input.requestDetails.trim().length === 0;
  }

  if (input.step === 3) {
    return input.budgetRange.length === 0;
  }

  if (input.step === 4) {
    return input.desiredTiming.length === 0;
  }

  if (input.step === 5) {
    return (
      input.contactMethod.length === 0 ||
      input.phone.trim().length === 0 ||
      !input.privacyConsent
    );
  }

  return false;
}

function getErrorStep(errors: NonNullable<AdvertiseFormState["errors"]>) {
  if (errors.advertisedItem) {
    return 0;
  }

  if (errors.requestDetails) {
    return 1;
  }

  if (errors.creatorPreferences) {
    return 2;
  }

  if (errors.budgetRange) {
    return 3;
  }

  if (errors.desiredTiming) {
    return 4;
  }

  return 5;
}
