import Link from "next/link";
import type { ReactNode } from "react";

type RequestCtaProps = {
  href: string;
  requestIntent: boolean;
};

export function RequestCta({ href, requestIntent }: RequestCtaProps) {
  return (
    <ResponsiveCta>
      <RequestCtaContent href={href} requestIntent={requestIntent} />
    </ResponsiveCta>
  );
}

export function SampleRequestCta({ href }: { href: string }) {
  return (
    <ResponsiveCta>
      <p className="text-base font-semibold text-neutral-950">
        이 상품은 광고 방식을 보여드리기 위한 예시입니다.
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        비슷한 광고를 원하시면 조건에 맞는 실제 크리에이터를 직접
        찾아보겠습니다.
      </p>
      <Link
        className="brand-primary mt-5 block w-full rounded-md border px-4 py-3 text-center text-sm font-semibold transition"
        href={href}
      >
        이 예시와 비슷한 광고 무료로 찾아보기
      </Link>
    </ResponsiveCta>
  );
}

function RequestCtaContent({ href, requestIntent }: RequestCtaProps) {
  return (
    <>
      <p className="text-base font-semibold text-neutral-950">
        관심 있는 광고가 있으신가요?
        <br />
        처음부터 끝까지 직접 진행을 도와드립니다.
      </p>
      <Link
        className="brand-primary mt-5 block w-full rounded-md border px-4 py-3 text-center text-sm font-semibold transition"
        href={href}
      >
        광고 진행하기
      </Link>
      {requestIntent ? (
        <p className="mt-3 text-sm text-neutral-600" role="status">
          다음 단계에서 광고 요청 기능이 연결됩니다.
        </p>
      ) : null}
    </>
  );
}

function ResponsiveCta({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="hidden rounded-lg border border-neutral-200 bg-white p-5 lg:sticky lg:top-6 lg:block">
        {children}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 px-4 py-3 shadow-[0_-1px_0_rgba(0,0,0,0.04)] backdrop-blur lg:hidden">
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
    </>
  );
}
