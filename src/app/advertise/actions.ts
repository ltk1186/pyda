"use server";

import { getCurrentUser } from "@/lib/auth/session";
import {
  parseCustomAdRequestFormData,
  type CustomAdContactMethod,
  type CustomAdRequestErrors,
} from "@/lib/custom-ad-requests/core";
import { submitCustomAdRequestWithDependencies } from "@/lib/custom-ad-requests/service";
import { notifyNewCustomAdRequest } from "@/lib/notifications/telegram";
import { readKakaoOpenChatUrl } from "@/lib/requests/open-chat";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdvertiseFormState = {
  errors?: CustomAdRequestErrors;
  message?: string;
  success?: {
    contactMethod: CustomAdContactMethod;
    openChatUrl: string | null;
  };
};

export async function submitCustomAdRequestAction(
  _state: AdvertiseFormState,
  formData: FormData,
): Promise<AdvertiseFormState> {
  const parsed = parseCustomAdRequestFormData(formData);

  if (!parsed.ok) {
    return {
      errors: parsed.errors,
    };
  }

  const user = await getCurrentUser();
  const result = await submitCustomAdRequestWithDependencies({
    request: parsed.data,
    userId: user?.id ?? null,
    insert: async (payload) => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("custom_ad_requests")
        .insert(payload)
        .select("id")
        .single();

      if (error || !data?.id) {
        throw new Error("custom-ad-request-insert-failed");
      }

      return {
        id: data.id as string,
      };
    },
    notify: async ({ id, request }) => {
      const result = await notifyNewCustomAdRequest({
        requestId: id,
        request,
      });

      if (result.status === "failed") {
        console.warn("custom_ad_request_notification_failed", {
          reason: result.reason,
        });
      }
    },
  });

  if (!result.ok) {
    return {
      message: result.message,
    };
  }

  return {
    success: {
      contactMethod: parsed.data.contactMethod,
      openChatUrl:
        parsed.data.contactMethod === "kakao" ? readKakaoOpenChatUrl() : null,
    },
  };
}
