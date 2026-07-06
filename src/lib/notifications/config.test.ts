import { describe, expect, it } from "vitest";
import { normalizeAppBaseUrl, readTelegramNotificationConfig } from "./config";

describe("telegram notification config", () => {
  it("skips when token is missing", () => {
    expect(
      readTelegramNotificationConfig({
        TELEGRAM_ADMIN_CHAT_ID: "chat-id",
        APP_BASE_URL: "https://pyda.io",
      }),
    ).toMatchObject({
      status: "skipped",
      reason: "missing-telegram-env",
      appBaseUrl: "https://pyda.io",
    });
  });

  it("skips when chat id is missing", () => {
    expect(
      readTelegramNotificationConfig({
        TELEGRAM_BOT_TOKEN: "token",
      }),
    ).toMatchObject({
      status: "skipped",
      reason: "missing-telegram-env",
    });
  });

  it("returns ready config when telegram env is present", () => {
    expect(
      readTelegramNotificationConfig({
        TELEGRAM_BOT_TOKEN: "token",
        TELEGRAM_ADMIN_CHAT_ID: "chat-id",
        APP_BASE_URL: "https://pyda.io/",
      }),
    ).toEqual({
      status: "ready",
      botToken: "token",
      adminChatId: "chat-id",
      appBaseUrl: "https://pyda.io",
    });
  });

  it("does not skip telegram when only APP_BASE_URL is missing", () => {
    expect(
      readTelegramNotificationConfig({
        TELEGRAM_BOT_TOKEN: "token",
        TELEGRAM_ADMIN_CHAT_ID: "chat-id",
      }),
    ).toEqual({
      status: "ready",
      botToken: "token",
      adminChatId: "chat-id",
      appBaseUrl: null,
    });
  });

  it("omits invalid APP_BASE_URL", () => {
    expect(normalizeAppBaseUrl("ftp://pyda.io")).toBeNull();
    expect(normalizeAppBaseUrl("not-url")).toBeNull();
  });
});
