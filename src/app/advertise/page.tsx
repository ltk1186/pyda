import {
  getPublicHeaderViewer,
  PublicHeader,
} from "@/components/navigation/public-header";
import { CustomAdRequestForm } from "@/components/advertise/custom-ad-request-form";
import { submitCustomAdRequestAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdvertisePage() {
  const headerProfile = await getPublicHeaderViewer();

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <PublicHeader currentPath="/advertise" profile={headerProfile} />

      <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            어떤 광고를 원하시나요?
          </h1>
          <p className="mt-4 text-base leading-7 text-neutral-600">
            원하는 상품이 아직 없어도 괜찮습니다. 광고 내용과 예산을
            알려주시면 조건에 맞는 크리에이터를 직접 찾아보고 연결을
            도와드립니다.
          </p>
          <p className="mt-3 text-sm leading-6 text-neutral-500">
            아직 정확한 조건을 몰라도 괜찮습니다. 알고 있는 내용만
            적어주세요.
          </p>
        </div>

        <CustomAdRequestForm action={submitCustomAdRequestAction} />
      </section>
    </main>
  );
}
