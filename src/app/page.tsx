import { ListingCard } from "@/components/marketplace/listing-card";
import { PlatformFilter } from "@/components/marketplace/platform-filter";
import {
  getPublicHeaderViewer,
  PublicHeader,
} from "@/components/navigation/public-header";
import { getPublicListings } from "@/lib/marketplace/data";
import { normalizePlatformFilter } from "@/lib/marketplace/format";

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

        <div className="mt-7">
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
