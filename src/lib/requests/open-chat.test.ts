import { describe, expect, it } from "vitest";
import { readKakaoOpenChatUrl } from "./open-chat";

describe("Kakao open chat URL", () => {
  it("returns null when the server env value is missing", () => {
    expect(readKakaoOpenChatUrl({})).toBeNull();
  });

  it("returns null for invalid or non-http values", () => {
    expect(readKakaoOpenChatUrl({ KAKAO_OPEN_CHAT_URL: "not-a-url" })).toBeNull();
    expect(
      readKakaoOpenChatUrl({ KAKAO_OPEN_CHAT_URL: "javascript:alert(1)" }),
    ).toBeNull();
  });

  it("returns a safe http URL when configured", () => {
    expect(
      readKakaoOpenChatUrl({
        KAKAO_OPEN_CHAT_URL: "https://open.kakao.com/o/example",
      }),
    ).toBe("https://open.kakao.com/o/example");
  });
});
