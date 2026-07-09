import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdvertiseSuccess } from "@/components/advertise/custom-ad-request-form";
import AdvertisePage from "./page";

vi.mock("server-only", () => ({}));

describe("AdvertisePage", () => {
  it("renders the public concierge demand form", async () => {
    const element = await AdvertisePage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain("어떤 광고를 원하시나요?");
    expect(html).toContain("무엇을 광고하고 싶나요?");
    expect(html).toContain("예상 예산");
    expect(html).toContain("카카오톡");
    expect(html).toContain("전화");
    expect(html).toContain("문의 답변과 크리에이터 연결을 위한 연락처 수집");
  });

  it("does not crash or show Kakao CTA when open chat URL is missing", () => {
    const html = renderToStaticMarkup(
      <AdvertiseSuccess
        success={{
          contactMethod: "kakao",
          openChatUrl: null,
        }}
      />,
    );

    expect(html).toContain("광고 요청을 받았습니다.");
    expect(html).toContain("빠르게 이야기하고 싶다면 카카오톡으로 바로 문의해주세요.");
    expect(html).not.toContain("카카오톡으로 바로 이야기하기");
  });

  it("shows Kakao open chat CTA when configured", () => {
    const html = renderToStaticMarkup(
      <AdvertiseSuccess
        success={{
          contactMethod: "kakao",
          openChatUrl: "https://open.kakao.com/o/example",
        }}
      />,
    );

    expect(html).toContain("카카오톡으로 바로 이야기하기");
    expect(html).toContain('href="https://open.kakao.com/o/example"');
  });

  it("shows phone follow-up copy for phone contact", () => {
    const html = renderToStaticMarkup(
      <AdvertiseSuccess
        success={{
          contactMethod: "phone",
          openChatUrl: null,
        }}
      />,
    );

    expect(html).toContain("전화로 연락드릴게요.");
  });
});
