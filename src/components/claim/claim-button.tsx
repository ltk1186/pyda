"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ClaimActionState } from "@/app/claim/[token]/actions";

type ClaimButtonProps = {
  action: (state: ClaimActionState) => Promise<ClaimActionState>;
};

const initialState: ClaimActionState = {};

export function ClaimButton({ action }: ClaimButtonProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      <SubmitButton />
      {state.message ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
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
      className="w-full rounded-md bg-neutral-950 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "연결 중" : "내 계정에 연결하기"}
    </button>
  );
}
