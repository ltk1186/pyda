"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  formatAdminRequestStatus,
  type AdminTransitionStatus,
} from "@/lib/admin/request-status";
import type { AdminActionState } from "@/app/admin/requests/actions";

type NotesFormProps = {
  action: (
    state: AdminActionState,
    formData: FormData,
  ) => Promise<AdminActionState>;
  defaultValue: string;
};

type StatusFormProps = {
  action: (
    state: AdminActionState,
    formData: FormData,
  ) => Promise<AdminActionState>;
  nextStatus: AdminTransitionStatus;
};

const initialState: AdminActionState = {};

export function AdminNotesForm({ action, defaultValue }: NotesFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="rounded-lg border border-neutral-200 p-4">
      <label className="text-sm font-medium text-neutral-950" htmlFor="adminNotes">
        관리자 메모
      </label>
      <textarea
        className="mt-2 min-h-32 w-full resize-y rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-950"
        defaultValue={defaultValue}
        id="adminNotes"
        name="adminNotes"
      />
      <ActionMessage state={state} />
      <SubmitButton label="메모 저장" pendingLabel="저장 중" />
    </form>
  );
}

export function AdminStatusForm({ action, nextStatus }: StatusFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const requiresQuote = nextStatus === "payment_ready";

  return (
    <form action={formAction} className="rounded-lg border border-neutral-200 p-4">
      <p className="text-sm font-medium text-neutral-950">
        {formatAdminRequestStatus(nextStatus)}로 변경
      </p>
      {requiresQuote ? (
        <div className="mt-3">
          <label
            className="text-sm text-neutral-600"
            htmlFor={`quotedAmountKrw-${nextStatus}`}
          >
            최종 가격
          </label>
          <input
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-950"
            id={`quotedAmountKrw-${nextStatus}`}
            inputMode="numeric"
            min="1"
            name="quotedAmountKrw"
            placeholder="예: 500000"
            type="number"
          />
        </div>
      ) : null}
      <ActionMessage state={state} />
      <SubmitButton label="상태 변경" pendingLabel="변경 중" />
    </form>
  );
}

function ActionMessage({ state }: { state: AdminActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={`mt-3 text-sm ${state.ok ? "text-neutral-600" : "text-red-700"}`}
      role="status"
    >
      {state.message}
    </p>
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
      className="mt-4 rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
