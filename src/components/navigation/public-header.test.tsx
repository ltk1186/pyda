import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicHeader } from "./public-header";

describe("PublicHeader", () => {
  it("shows creator registration and login for signed-out users", () => {
    const html = renderToStaticMarkup(
      <PublicHeader currentPath="/listings/sample" profile={null} />,
    );

    expect(html).toContain('href="/"');
    expect(html).toContain(">Pyda<");
    expect(html).toContain('href="/how-it-works"');
    expect(html).toContain("이용 방법");
    expect(html).toContain('href="/creator/start"');
    expect(html).toContain("크리에이터 등록하기");
    expect(html).toContain("로그인");
    expect(html).not.toContain("마이페이지");
    expect(html).toContain(
      'href="/login?next=%2Flistings%2Fsample"',
    );
  });

  it("hides login and shows a fallback profile avatar for signed-in users", () => {
    const html = renderToStaticMarkup(
      <PublicHeader
        currentPath="/account"
        profile={{ displayName: "오늘의제주", avatarUrl: null }}
      />,
    );

    expect(html).not.toContain(">로그인<");
    expect(html).not.toContain("마이페이지");
    expect(html).not.toContain("크리에이터 등록하기");
    expect(html).not.toContain("로그아웃");
    expect(html).toContain('href="/how-it-works"');
    expect(html).toContain('href="/account"');
    expect(html).toContain("오늘의제주");
    expect(html).toContain(">오<");
  });

  it("shows the profile image when one exists", () => {
    const html = renderToStaticMarkup(
      <PublicHeader
        currentPath="/"
        profile={{
          displayName: "오늘의제주",
          avatarUrl: "https://example.com/avatar.png",
        }}
      />,
    );

    expect(html).toContain("https://example.com/avatar.png");
    expect(html).not.toContain(">로그인<");
  });

  it("renders an accessible mobile menu button", () => {
    const html = renderToStaticMarkup(
      <PublicHeader currentPath="/" profile={null} />,
    );

    expect(html).toContain('aria-label="메뉴 열기"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain(">메뉴<");
  });
});
