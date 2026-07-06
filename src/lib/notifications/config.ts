export type TelegramNotificationConfig =
  | {
      status: "ready";
      botToken: string;
      adminChatId: string;
      appBaseUrl: string | null;
    }
  | {
      status: "skipped";
      reason: "missing-telegram-env";
      appBaseUrl: string | null;
    };

type NotificationEnv = {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_ADMIN_CHAT_ID?: string;
  APP_BASE_URL?: string;
};

export function readTelegramNotificationConfig(
  env: NotificationEnv = process.env as Record<string, string | undefined>,
): TelegramNotificationConfig {
  const botToken = env.TELEGRAM_BOT_TOKEN?.trim();
  const adminChatId = env.TELEGRAM_ADMIN_CHAT_ID?.trim();
  const appBaseUrl = normalizeAppBaseUrl(env.APP_BASE_URL);

  if (!botToken || !adminChatId) {
    return {
      status: "skipped",
      reason: "missing-telegram-env",
      appBaseUrl,
    };
  }

  return {
    status: "ready",
    botToken,
    adminChatId,
    appBaseUrl,
  };
}

export function normalizeAppBaseUrl(value: string | undefined | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.origin + parsed.pathname.replace(/\/+$/, "");
  } catch {
    return null;
  }
}
