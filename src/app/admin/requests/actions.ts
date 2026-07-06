"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import {
  buildRequestStatusUpdateMatch,
  canAdminTransitionRequest,
  parsePositiveKrw,
  type AdminTransitionStatus,
} from "@/lib/admin/request-status";
import type { RequestStatus } from "@/lib/requests/status";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminActionState = {
  message?: string;
  ok?: boolean;
};

const staleStatusMessage =
  "요청 상태가 이미 변경되었습니다. 새로고침 후 다시 확인해주세요.";

export async function updateAdminRequestNotes(
  requestId: string,
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin(`/admin/requests/${requestId}`);

  const notesValue = formData.get("adminNotes");
  const adminNotes =
    typeof notesValue === "string" && notesValue.trim().length > 0
      ? notesValue.trim()
      : null;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("requests")
    .update({ admin_notes: adminNotes })
    .eq("id", requestId);

  if (error) {
    return { message: "관리자 메모를 저장하지 못했습니다." };
  }

  revalidateAdminRequestPaths(requestId);
  return { ok: true, message: "관리자 메모를 저장했습니다." };
}

export async function updateAdminRequestStatus(
  requestId: string,
  nextStatus: AdminTransitionStatus,
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin(`/admin/requests/${requestId}`);

  const supabase = createAdminClient();
  const { data: current, error: readError } = await supabase
    .from("requests")
    .select("id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (readError || !current) {
    return { message: "광고 요청을 찾지 못했습니다." };
  }

  const currentStatus = current.status as RequestStatus;

  if (!canAdminTransitionRequest(currentStatus, nextStatus)) {
    return { message: "허용되지 않은 상태 변경입니다." };
  }

  if (nextStatus === "payment_ready") {
    const quotedAmountKrw = parsePositiveKrw(formData.get("quotedAmountKrw"));

    if (!quotedAmountKrw) {
      return { message: "최종 가격은 0보다 큰 원 단위 정수여야 합니다." };
    }

    if (currentStatus !== "checking") {
      return { message: "확인 중 상태에서만 결제 가능으로 변경할 수 있습니다." };
    }

    const match = buildRequestStatusUpdateMatch(requestId, currentStatus);
    const { data: updated, error } = await supabase
      .from("requests")
      .update({
        quoted_amount_krw: quotedAmountKrw,
        status: "payment_ready",
      })
      .eq("id", match.id)
      .eq("status", match.status)
      .select("id")
      .maybeSingle();

    if (error) {
      return { message: "요청 상태를 변경하지 못했습니다." };
    }

    if (!updated) {
      return { message: staleStatusMessage };
    }
  } else {
    const match = buildRequestStatusUpdateMatch(requestId, currentStatus);
    const { data: updated, error } = await supabase
      .from("requests")
      .update({ status: nextStatus })
      .eq("id", match.id)
      .eq("status", match.status)
      .select("id")
      .maybeSingle();

    if (error) {
      return { message: "요청 상태를 변경하지 못했습니다." };
    }

    if (!updated) {
      return { message: staleStatusMessage };
    }
  }

  revalidateAdminRequestPaths(requestId);
  return { ok: true, message: "요청 상태를 변경했습니다." };
}

function revalidateAdminRequestPaths(requestId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${requestId}`);
}
