import type { RequestStatus } from "@/lib/requests/status";

export type AdminTransitionStatus =
  | "checking"
  | "payment_ready"
  | "declined"
  | "cancelled";

const adminStatusLabels: Record<RequestStatus, string> = {
  submitted: "신규 요청",
  checking: "확인 중",
  payment_ready: "결제 가능",
  paid: "결제 완료",
  in_progress: "집행 중",
  completed: "완료",
  declined: "진행 불가",
  cancelled: "취소",
};

const allowedTransitions: Partial<Record<RequestStatus, AdminTransitionStatus[]>> =
  {
    submitted: ["checking", "declined", "cancelled"],
    checking: ["payment_ready", "declined", "cancelled"],
  };

export function formatAdminRequestStatus(status: RequestStatus) {
  return adminStatusLabels[status] ?? status;
}

export function getAllowedAdminRequestTransitions(status: RequestStatus) {
  return allowedTransitions[status] ?? [];
}

export function canAdminTransitionRequest(
  fromStatus: RequestStatus,
  toStatus: string,
) {
  return getAllowedAdminRequestTransitions(fromStatus).includes(
    toStatus as AdminTransitionStatus,
  );
}

export function buildRequestStatusUpdateMatch(
  requestId: string,
  currentStatus: RequestStatus,
) {
  return {
    id: requestId,
    status: currentStatus,
  };
}

export function parsePositiveKrw(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value.trim())) {
    return null;
  }

  const amount = Number(value);

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return null;
  }

  return amount;
}
