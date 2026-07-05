import Link from "next/link";

type RequestCtaProps = {
  href: string;
  requestIntent: boolean;
};

export function RequestCta({ href, requestIntent }: RequestCtaProps) {
  return (
    <>
      <div className="hidden rounded-lg border border-neutral-200 bg-white p-5 lg:sticky lg:top-6 lg:block">
        <RequestCtaContent href={href} requestIntent={requestIntent} />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 px-4 py-3 shadow-[0_-1px_0_rgba(0,0,0,0.04)] backdrop-blur lg:hidden">
        <div className="mx-auto max-w-6xl">
          <RequestCtaContent href={href} requestIntent={requestIntent} />
        </div>
      </div>
    </>
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
        className="mt-5 block w-full rounded-md bg-neutral-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-neutral-800"
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
