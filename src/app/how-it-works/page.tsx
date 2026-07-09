import Link from "next/link";
import {
  getPublicHeaderViewer,
  PublicHeader,
} from "@/components/navigation/public-header";

export default async function HowItWorksPage() {
  const headerProfile = await getPublicHeaderViewer();

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <PublicHeader currentPath="/how-it-works" profile={headerProfile} />

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Pyda는 이렇게 이용합니다
          </h1>
          <p className="mt-4 text-base leading-7 text-neutral-600">
            광고를 찾고 있든, 내 콘텐츠의 광고 자리를 판매하고 싶든
            필요한 흐름만 간단하게 시작할 수 있습니다.
          </p>
        </div>

        <nav
          className="mt-8 flex flex-wrap gap-3"
          aria-label="이용 방법 섹션"
        >
          <Link
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            href="#advertisers"
          >
            광고주
          </Link>
          <Link
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            href="#creators"
          >
            크리에이터
          </Link>
        </nav>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <section
            className="rounded-2xl border border-neutral-200 p-6"
            id="advertisers"
          >
            <p className="text-sm font-semibold text-neutral-500">광고주</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              원하는 광고 자리를 찾고 바로 이야기하세요.
            </h2>
            <ol className="mt-5 space-y-3 text-sm leading-6 text-neutral-700">
              <li>1. 광고 상품을 둘러봅니다</li>
              <li>2. 원하는 상품에 요청을 보냅니다</li>
              <li>3. 카카오톡이나 전화로 조건을 조율합니다</li>
            </ol>
            <p className="mt-5 text-sm leading-6 text-neutral-600">
              원하는 상품이 아직 없다면, Pyda가 조건에 맞는 크리에이터를
              직접 찾아 연결해드립니다.
            </p>
            <Link
              className="mt-6 inline-flex rounded-full bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
              href="/#marketplace"
            >
              광고 상품 보기
            </Link>
          </section>

          <section
            className="rounded-2xl border border-neutral-200 p-6"
            id="creators"
          >
            <p className="text-sm font-semibold text-neutral-500">크리에이터</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              내 콘텐츠의 광고 자리를 등록하세요.
            </h2>
            <ol className="mt-5 space-y-3 text-sm leading-6 text-neutral-700">
              <li>1. 운영하는 채널을 등록합니다</li>
              <li>2. 판매할 광고 방식을 고릅니다</li>
              <li>3. 희망 가격을 정합니다</li>
              <li>4. Pyda가 확인한 뒤 공개합니다</li>
            </ol>
            <p className="mt-5 text-sm leading-6 text-neutral-600">
              영상 전체를 광고로 만들 필요는 없습니다. 30초 소개,
              고정댓글, 설명란 링크, 프로필 링크 같은 자리도 판매할 수
              있습니다.
            </p>
            <Link
              className="mt-6 inline-flex rounded-full bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
              href="/creator/start"
            >
              크리에이터 등록하기
            </Link>
          </section>
        </div>
      </section>
    </main>
  );
}
