import Link from "next/link";
import { OnboardingCompleteForm } from "@/components/creator/onboarding-complete-form";
import { formatRequestDate } from "@/lib/requests";
import { requireOwnedCreator } from "@/lib/creator/owner";
import { completeCreatorOnboarding } from "./actions";

export const dynamic = "force-dynamic";

export default async function CreatorPage() {
  const creator = await requireOwnedCreator("/creator");

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">크리에이터</h1>
      {creator ? (
        <div className="mt-6 space-y-6">
          <section className="rounded-lg border border-neutral-200 p-6">
            <p className="text-sm font-medium text-neutral-600">
              계정 연결 완료
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              안녕하세요, {creator.displayName}님
            </h2>
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
              <Stat label="공개 상품" value={creator.publishedListingCount} />
              <Stat label="숨김 상품" value={creator.hiddenListingCount} />
              <Stat label="작성 중 상품" value={creator.draftListingCount} />
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
                href="/creator/listings/new"
              >
                새 광고 상품 추가
              </Link>
              <Link
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
                href="/creator/profile"
              >
                프로필 수정
              </Link>
              <Link
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
                href="/creator/listings"
              >
                내 광고 상품
              </Link>
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 p-6">
            <h2 className="text-base font-semibold">직접 온보딩</h2>
            {creator.onboardedAt ? (
              <div className="mt-4 rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
                <p className="font-medium">온보딩 완료</p>
                <p className="mt-1">완료일 {formatRequestDate(creator.onboardedAt)}</p>
              </div>
            ) : creator.status === "archived" ? (
              <p className="mt-3 text-sm text-neutral-600">
                보관된 크리에이터는 온보딩을 완료할 수 없습니다.
              </p>
            ) : creator.nonArchivedListingCount < 1 ? (
              <p className="mt-3 text-sm text-neutral-600">
                광고 상품을 최소 1개 등록하면 온보딩 완료를 확정할 수 있습니다.
              </p>
            ) : (
              <OnboardingCompleteForm action={completeCreatorOnboarding} />
            )}
          </section>
        </div>
      ) : (
        <NoCreatorProfile />
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-neutral-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}

function NoCreatorProfile() {
  return (
    <div className="mt-6 rounded-lg border border-neutral-200 p-6">
      <p className="text-sm text-neutral-600">
        연결된 크리에이터 프로필이 없습니다.
      </p>
    </div>
  );
}
