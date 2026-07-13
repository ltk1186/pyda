"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

type ClaimActionState = {
  message?: string;
};

type ClaimButtonProps = {
  action: (state: ClaimActionState) => Promise<ClaimActionState>;
  label?: string;
  pendingLabel?: string;
};

const initialState: ClaimActionState = {};

export function ClaimButton({
  action,
  label = "내 계정에 연결하기",
  pendingLabel = "연결 중",
}: ClaimButtonProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      <SubmitButton label={label} pendingLabel={pendingLabel} />
      {state.message ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className="brand-primary w-full rounded-md border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed"
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
