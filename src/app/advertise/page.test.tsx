import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdvertiseSuccess } from "@/components/advertise/custom-ad-request-form";
import AdvertisePage from "./page";

vi.mock("server-only", () => ({}));

describe("AdvertisePage", () => {
  it("renders the public concierge demand form", async () => {
    const element = await AdvertisePage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain("모두의 창업 1차 선정 · 제주 파일럿 진행 중");
    expect(html).toContain("어떤 광고를 원하시나요?");
    expect(html).toContain("견적 확인까지 비용이 없습니다.");
    expect(html).toContain("조건 확인 후 영업일 2일 안에 먼저 연락드립니다.");
    expect(html).toContain("무엇을 광고하고 싶으신가요?");
    expect(html).toContain("1 / 6");
    expect(html).toContain("견적 문의");
    expect(html).not.toContain("어느 정도 예산으로 먼저 알아볼까요?");
    expect(html).not.toContain(
      "문의 답변과 크리에이터 연결을 위한 연락처 수집",
    );
    expect(html).toContain('name="source"');
    expect(html).toContain('value="homepage_concierge"');
  });

  it("passes a sanitized source from query params into the form", async () => {
    const element = await AdvertisePage({
      searchParams: Promise.resolve({ src: "TalkTalk_Stay" }),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('name="source"');
    expect(html).toContain('value="talktalk_stay"');
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
    expect(html).toContain(
      "남겨주신 조건을 확인하고 영업일 2일 안에 먼저 연락드립니다.",
    );
    expect(html).toContain(
      "조건에 맞는 크리에이터 후보를 찾고 가능 여부를 확인합니다.",
    );
    expect(html).not.toContain(
      "빠르게 이야기하고 싶다면 카카오톡으로 바로 문의해주세요.",
    );
    expect(html).not.toContain("카카오톡으로 바로 이야기하기");
    expect(html).toContain("남겨주신 번호로 연락드릴게요.");
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
    expect(html).toContain("빠르게 이야기하고 싶다면 카카오톡으로 바로 문의해주세요.");
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
