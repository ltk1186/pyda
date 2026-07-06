"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPublicListingBySlug } from "@/lib/marketplace/data";
import { shouldAttemptRequestNotification } from "@/lib/notifications/request-message";
import { notifyNewAdvertisementRequest } from "@/lib/notifications/telegram";
import {
  buildRequestInsertPayload,
  parseRequestFormData,
  type RequestFormErrors,
} from "@/lib/requests";
import { createClient } from "@/lib/supabase/server";

export type RequestFormState = {
  errors?: RequestFormErrors;
  message?: string;
};

export async function createAdvertisementRequest(
  listingSlug: string,
  _state: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const requestPath = `/listings/${listingSlug}?request=1`;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(requestPath)}`);
  }

  const parsed = parseRequestFormData(formData);

  if (!parsed.ok) {
    return {
      errors: parsed.errors,
    };
  }

  const listing = await getPublicListingBySlug(listingSlug);

  if (!listing) {
    return {
      message: "공개 상태의 광고 상품을 찾을 수 없습니다.",
    };
  }

  const payload = buildRequestInsertPayload(parsed.data, user.id, listing.id);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requests")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data?.id) {
    return {
      message: "광고 요청을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
    };
  }

  if (
    shouldAttemptRequestNotification({
      insertedRequestId: data.id as string,
      insertFailed: false,
    })
  ) {
    await notifyNewAdvertisementRequest({
      requestId: data.id as string,
      request: parsed.data,
      listing,
    });
  }

  redirect(`/account/requests/${data.id}`);
}
