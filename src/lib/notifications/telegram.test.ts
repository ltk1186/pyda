import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { sendTelegramMessage } from "./telegram";
import type { TelegramNotificationConfig } from "./config";

const readyConfig: TelegramNotificationConfig = {
  status: "ready",
  botToken: "token",
  adminChatId: "chat-id",
  appBaseUrl: "https://pyda.io",
};

describe("sendTelegramMessage", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("uses POST JSON with chat_id and text", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    const result = await sendTelegramMessage({
      text: "hello",
      config: readyConfig,
      fetchImpl,
    });

    expect(result).toEqual({ status: "sent" });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.telegram.org/bottoken/sendMessage",
      expect.objectContaining({
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          chat_id: "chat-id",
          text: "hello",
        }),
      }),
    );
  });

  it("returns skipped when telegram config is missing", async () => {
    const result = await sendTelegramMessage({
      text: "hello",
      config: {
        status: "skipped",
        reason: "missing-telegram-env",
        appBaseUrl: null,
      },
      fetchImpl: vi.fn(),
    });

    expect(result).toEqual({
      status: "skipped",
      reason: "missing-config",
    });
  });

  it("treats Telegram ok true as success", async () => {
    await expect(
      sendTelegramMessage({
        text: "hello",
        config: readyConfig,
        fetchImpl: async () => ({
          ok: true,
          json: async () => ({ ok: true }),
        }),
      }),
    ).resolves.toEqual({ status: "sent" });
  });

  it("returns failure for HTTP errors", async () => {
    await expect(
      sendTelegramMessage({
        text: "hello",
        config: readyConfig,
        fetchImpl: async () => ({
          ok: false,
          json: async () => ({ ok: false }),
        }),
      }),
    ).resolves.toEqual({ status: "failed", reason: "http" });
  });

  it("returns failure for Telegram ok false", async () => {
    await expect(
      sendTelegramMessage({
        text: "hello",
        config: readyConfig,
        fetchImpl: async () => ({
          ok: true,
          json: async () => ({ ok: false }),
        }),
      }),
    ).resolves.toEqual({ status: "failed", reason: "telegram" });
  });

  it("returns failure for network errors without throwing", async () => {
    await expect(
      sendTelegramMessage({
        text: "hello",
        config: readyConfig,
        fetchImpl: async () => {
          throw new Error("network down");
        },
      }),
    ).resolves.toEqual({ status: "failed", reason: "network" });
  });

  it("returns timeout failure without throwing", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(
      (_input: string, init: RequestInit) =>
        new Promise<never>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );
    const resultPromise = sendTelegramMessage({
      text: "hello",
      config: readyConfig,
      fetchImpl,
      timeoutMs: 10,
    });

    await vi.advanceTimersByTimeAsync(10);

    await expect(resultPromise).resolves.toEqual({
      status: "failed",
      reason: "timeout",
    });
  });
});
