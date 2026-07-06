"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AdminFoundingApprovalState } from "@/app/admin/creators/actions";

type FoundingApprovalFormProps = {
  action: (
    state: AdminFoundingApprovalState,
    formData: FormData,
  ) => Promise<AdminFoundingApprovalState>;
};

const initialState: AdminFoundingApprovalState = {};

export function FoundingApprovalForm({ action }: FoundingApprovalFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-4">
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
      className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "확정 중" : "Founding Creator 확정"}
    </button>
  );
}
