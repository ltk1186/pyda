import Link from "next/link";
import { ListingCard } from "@/components/marketplace/listing-card";
import { PlatformFilter } from "@/components/marketplace/platform-filter";
import {
  getPublicHeaderViewer,
  PublicHeader,
} from "@/components/navigation/public-header";
import { getPublicListings } from "@/lib/marketplace/data";
import { normalizePlatformFilter } from "@/lib/marketplace/format";
import { readKakaoOpenChatUrl } from "@/lib/requests/open-chat";

type HomeProps = {
  searchParams: Promise<{
    platform?: string | string[];
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const activePlatform = normalizePlatformFilter(params.platform);
  const listings = await getPublicListings(activePlatform);
  const headerProfile = await getPublicHeaderViewer();
  const openChatUrl = readKakaoOpenChatUrl();
  const inquiryHref = openChatUrl ?? "/how-it-works#advertisers";
  const currentPath =
    activePlatform === "전체"
      ? "/"
      : `/?platform=${encodeURIComponent(activePlatform)}`;

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <PublicHeader currentPath={currentPath} profile={headerProfile} />

      <section className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            누가, 어디에, 무엇을, 얼마에 해주는가.
          </h1>
          <p className="mt-3 text-base leading-7 text-neutral-600">
            크리에이터의 광고 자리를 직접 보고 원하는 광고를 진행해보세요.
            지금은 실제 거래 검증을 위한 예시 광고 상품을 먼저 보여드립니다.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-6 sm:px-6">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700">
              모두의 창업 1R 선정 · MVP 검증 중
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              Pyda는 지금 막 시작했습니다.
            </h2>
            <p className="mt-3 text-sm leading-7 text-neutral-600">
              현재 공개된 상품은 광고 거래 방식을 보여드리기 위한
              예시입니다. 실제 크리에이터 모집을 시작했고, 광고주 요청이
              들어오면 원하는 조건에 맞는 크리에이터를 직접 찾아
              연결해드립니다.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                className="inline-flex rounded-full bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
                href={inquiryHref}
                rel={openChatUrl ? "noreferrer" : undefined}
                target={openChatUrl ? "_blank" : undefined}
              >
                원하는 광고 문의하기
              </Link>
              <Link
                className="inline-flex rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-white"
                href="/creator/start"
              >
                크리에이터 등록하기
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-7" id="marketplace">
          <PlatformFilter activePlatform={activePlatform} />
        </div>

        <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>

        {listings.length === 0 ? (
          <p className="mt-10 rounded-lg border border-neutral-200 px-4 py-8 text-center text-sm text-neutral-600">
            선택한 플랫폼의 공개 예시 광고 상품이 없습니다.
          </p>
        ) : null}
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-neutral-950">
              Founding Creator
            </p>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              초기 크리에이터는 직접 온보딩, 공개 광고 상품, 관리자 승인을
              거쳐 Founding Creator로 확정됩니다. 확정된 크리에이터는 거래
              정산에서 더 낮은 실질 수수료를 적용받습니다.
            </p>
            <Link
              className="mt-5 inline-flex rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
              href="/creator/start"
            >
              크리에이터로 시작하기
            </Link>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-950">
              서비스 이용 방법
            </p>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-neutral-600">
              <li>1. 로그인 없이 광고 상품을 탐색합니다.</li>
              <li>2. 상세 페이지에서 크리에이터와 광고 형식을 확인합니다.</li>
              <li>3. 다음 단계에서 광고 요청 기능이 연결됩니다.</li>
            </ol>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Footer() {
  return (
    <footer className="border-t border-neutral-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-neutral-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p>Pyda MVP</p>
        <p>예시 상품으로 첫 거래 흐름을 검증합니다.</p>
      </div>
    </footer>
  );
}
