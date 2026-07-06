"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { OnboardingCompleteState } from "@/app/creator/actions";

type OnboardingCompleteFormProps = {
  action: (
    state: OnboardingCompleteState,
    formData: FormData,
  ) => Promise<OnboardingCompleteState>;
};

const initialState: OnboardingCompleteState = {};

export function OnboardingCompleteForm({ action }: OnboardingCompleteFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-4">
      <p className="text-sm text-neutral-600">
        프로필과 광고 상품을 모두 확인했습니다.
      </p>
      <SubmitButton />
      {state.message ? (
        <p
          className={`mt-3 text-sm ${state.ok ? "text-neutral-600" : "text-red-700"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="mt-3 rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "완료 처리 중" : "온보딩 완료"}
    </button>
  );
}
