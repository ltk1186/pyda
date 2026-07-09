import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HowItWorksPage from "./page";

describe("HowItWorksPage", () => {
  it("renders advertiser and creator flows", async () => {
    const element = await HowItWorksPage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Pyda는 이렇게 이용합니다");
    expect(html).toContain("원하는 광고 자리를 찾고 바로 이야기하세요.");
    expect(html).toContain("카카오톡이나 전화로 조건을 조율합니다");
    expect(html).toContain('href="/#marketplace"');
    expect(html).toContain("내 콘텐츠의 광고 자리를 등록하세요.");
    expect(html).toContain("30초 소개");
    expect(html).toContain('href="/creator/start"');
  });
});
