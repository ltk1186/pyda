import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnedCreatorSummary } from "@/lib/claim/data";

export const dynamic = "force-dynamic";

export default async function CreatorPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/creator")}`);
  }

  const creator = await getOwnedCreatorSummary(user.id);

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="text-lg font-semibold tracking-tight" href="/">
            Pyda
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">크리에이터</h1>
        {creator ? (
          <div className="mt-6 rounded-lg border border-neutral-200 p-6">
            <p className="text-sm font-medium text-neutral-600">
              계정 연결 완료
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              {creator.displayName}
            </h2>
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-neutral-500">공개 상품</dt>
                <dd className="mt-1 font-semibold">
                  {creator.publishedListingCount}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">숨김 상품</dt>
                <dd className="mt-1 font-semibold">
                  {creator.hiddenListingCount}
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-sm text-neutral-600">
              프로필 수정과 상품 관리는 다음 단계에서 연결됩니다.
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-neutral-200 p-6">
            <p className="text-sm text-neutral-600">
              연결된 크리에이터 프로필이 없습니다.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
