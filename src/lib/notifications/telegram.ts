import "server-only";

import type { CustomAdRequestInput } from "@/lib/custom-ad-requests/core";
import type { PublicListing } from "@/lib/marketplace/types";
import type { RequestFormInput } from "@/lib/requests";
import {
  readTelegramNotificationConfig,
  type TelegramNotificationConfig,
} from "./config";
import {
  buildCustomAdRequestTelegramMessage,
  buildNewRequestTelegramMessage,
} from "./request-message";

export type TelegramSendResult =
  | {
      status: "sent";
    }
  | {
      status: "skipped";
      reason: "missing-config";
    }
  | {
      status: "failed";
      reason: "timeout" | "network" | "http" | "telegram";
    };

type FetchLike = (
  input: string,
  init: RequestInit,
) => Promise<Pick<Response, "ok" | "json">>;

export async function sendTelegramMessage(params: {
  text: string;
  config?: TelegramNotificationConfig;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
}): Promise<TelegramSendResult> {
  const config = params.config ?? readTelegramNotificationConfig();

  if (config.status === "skipped") {
    return {
      status: "skipped",
      reason: "missing-config",
    };
  }

  const fetchImpl = params.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), params.timeoutMs ?? 3000);

  try {
    const response = await fetchImpl(
      `https://api.telegram.org/bot${config.botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          chat_id: config.adminChatId,
          text: params.text,
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return {
        status: "failed",
        reason: "http",
      };
    }

    const payload = (await response.json().catch(() => null)) as
      | {
          ok?: unknown;
        }
      | null;

    if (payload?.ok !== true) {
      return {
        status: "failed",
        reason: "telegram",
      };
    }

    return {
      status: "sent",
    };
  } catch (error) {
    return {
      status: "failed",
      reason: isAbortError(error) ? "timeout" : "network",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function notifyNewAdvertisementRequest(input: {
  requestId: string;
  request: RequestFormInput;
  listing: PublicListing;
}) {
  try {
    const config = readTelegramNotificationConfig();
    const text = buildNewRequestTelegramMessage({
      requestId: input.requestId,
      request: input.request,
      listing: {
        title: input.listing.title,
        platform: input.listing.platform,
        adFormat: input.listing.adFormat,
        creator: {
          displayName: input.listing.creator.displayName,
        },
      },
      appBaseUrl: config.appBaseUrl,
    });

    return await sendTelegramMessage({
      text,
      config,
    });
  } catch {
    return {
      status: "failed",
      reason: "network",
    } satisfies TelegramSendResult;
  }
}

export async function notifyNewCustomAdRequest(input: {
  requestId: string;
  request: CustomAdRequestInput;
}) {
  try {
    const config = readTelegramNotificationConfig();
    const text = buildCustomAdRequestTelegramMessage({
      requestId: input.requestId,
      request: input.request,
    });

    return await sendTelegramMessage({
      text,
      config,
    });
  } catch {
    return {
      status: "failed",
      reason: "network",
    } satisfies TelegramSendResult;
  }
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}
