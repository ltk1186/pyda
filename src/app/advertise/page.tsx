import {
  getPublicHeaderViewer,
  PublicHeader,
} from "@/components/navigation/public-header";
import { CustomAdRequestForm } from "@/components/advertise/custom-ad-request-form";
import { sanitizeCustomAdSource } from "@/lib/custom-ad-requests/core";
import { submitCustomAdRequestAction } from "./actions";

export const dynamic = "force-dynamic";

type AdvertisePageProps = {
  searchParams?: Promise<{
    src?: string | string[];
  }>;
};

export default async function AdvertisePage({
  searchParams,
}: AdvertisePageProps = {}) {
  const headerProfile = await getPublicHeaderViewer();
  const params = searchParams ? await searchParams : {};
  const source = sanitizeCustomAdSource(getFirstParam(params.src));

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <PublicHeader currentPath="/advertise" profile={headerProfile} />

      <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <span className="inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700">
            모두의 창업 1차 선정 · 제주 파일럿 진행 중
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            어떤 광고를 원하시나요?
          </h1>
          <p className="mt-4 text-base leading-7 text-neutral-600">
            원하는 상품이 아직 없어도 괜찮습니다. 광고 내용과 예산을
            알려주시면 조건에 맞는 크리에이터를 직접 찾아보고 연결을
            도와드립니다. 크리에이터를 찾고 연결해드리는 데 별도 비용은
            없습니다. 실제 광고비는 크리에이터와 조건을 확인한 뒤
            결정합니다.
          </p>
          <p className="mt-3 text-sm leading-6 text-neutral-500">
            아직 정확한 조건을 몰라도 괜찮습니다. 알고 있는 내용만
            적어주세요.
          </p>
          <ul className="mt-5 space-y-2 text-sm leading-6 text-neutral-700">
            <li>✓ 견적 확인까지 비용이 없습니다.</li>
            <li>✓ 진행 여부는 견적을 보신 후 결정하시면 됩니다.</li>
            <li>✓ 조건 확인 후 영업일 2일 안에 먼저 연락드립니다.</li>
          </ul>
        </div>

        <CustomAdRequestForm action={submitCustomAdRequestAction} source={source} />
      </section>
    </main>
  );
}

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
