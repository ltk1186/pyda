export type RequestStatus =
  | "submitted"
  | "checking"
  | "payment_ready"
  | "paid"
  | "in_progress"
  | "completed"
  | "declined"
  | "cancelled";

const labels: Record<RequestStatus, string> = {
  submitted: "요청 접수",
  checking: "확인 중",
  payment_ready: "결제 가능",
  paid: "결제 완료",
  in_progress: "집행 중",
  completed: "완료",
  declined: "진행 불가",
  cancelled: "취소",
};

export function formatRequestStatus(status: RequestStatus) {
  return labels[status] ?? status;
}
