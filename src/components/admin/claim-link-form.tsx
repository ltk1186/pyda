"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AdminClaimLinkState } from "@/app/admin/creators/actions";

type ClaimLinkFormProps = {
  action: (
    state: AdminClaimLinkState,
    formData: FormData,
  ) => Promise<AdminClaimLinkState>;
};

const initialState: AdminClaimLinkState = {};

export function ClaimLinkForm({ action }: ClaimLinkFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  async function copyClaimLink() {
    if (!state.claimPath) {
      return;
    }

    await navigator.clipboard.writeText(`${window.location.origin}${state.claimPath}`);
  }

  return (
    <form action={formAction} className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="text-base font-semibold">온보딩 링크</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        새 링크를 생성하면 이전 링크는 즉시 무효화됩니다. 원문 링크는 저장되지
        않으므로 새로고침 후에는 다시 표시되지 않습니다.
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
      {state.claimPath ? (
        <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <p className="break-all text-sm font-medium">{state.claimPath}</p>
          <button
            className="mt-3 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
            onClick={() => {
              void copyClaimLink();
            }}
            type="button"
          >
            전체 링크 복사
          </button>
        </div>
      ) : null}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="mt-4 rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "생성 중" : "새 온보딩 링크 생성"}
    </button>
  );
}
