import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/navigation/public-header";
import {
  buildCreatorActivitySummary,
  getProfileInitial,
  summarizeRequests,
} from "@/lib/account/core";
import { getAccountOverview } from "@/lib/account/data";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/account")}`);
  }

  const { profile, requests, creator } = await getAccountOverview(user.id);
  const requestSummary = summarizeRequests(requests);
  const creatorSummary = buildCreatorActivitySummary(creator);

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <PublicHeader currentPath="/account" profile={profile} />

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">마이페이지</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            내 정보와 광고 요청을 한 곳에서 확인하세요.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <section className="rounded-lg border border-neutral-200 p-5">
            <h2 className="text-base font-semibold">기본 정보</h2>
            <div className="mt-5 flex items-center gap-3">
              {profile.avatarUrl ? (
                <Image
                  className="h-14 w-14 rounded-full bg-neutral-100 object-cover"
                  src={profile.avatarUrl}
                  alt=""
                  width={56}
                  height={56}
                  unoptimized
                />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-base font-semibold text-neutral-700">
                  {getProfileInitial(profile.displayName)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-950">
                  {profile.displayName}
                </p>
                <p className="mt-1 text-sm text-neutral-600">카카오로 로그인</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 p-5">
            <h2 className="text-base font-semibold">내 광고 요청</h2>
            {requestSummary.totalCount > 0 ? (
              <div className="mt-5">
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-neutral-500">전체 요청</dt>
                    <dd className="mt-1 text-xl font-semibold">
                      {requestSummary.totalCount}건
                    </dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">진행 중</dt>
                    <dd className="mt-1 text-xl font-semibold">
                      {requestSummary.activeCount}건
                    </dd>
                  </div>
                </dl>
                <Link
                  className="mt-5 inline-flex rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
                  href="/account/requests"
                >
                  요청 내역 보기
                </Link>
              </div>
            ) : (
              <div className="mt-5 text-sm leading-6 text-neutral-600">
                <p>아직 광고 요청이 없습니다.</p>
                <p className="mt-2">
                  광고 상품을 둘러보고 필요한 광고를 요청해보세요.
                </p>
                <Link
                  className="mt-5 inline-flex rounded-md border border-neutral-300 px-4 py-2 font-semibold text-neutral-950 hover:bg-neutral-50"
                  href="/"
                >
                  광고 상품 보기
                </Link>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-neutral-200 p-5">
            <h2 className="text-base font-semibold">크리에이터 활동</h2>
            <div className="mt-5 text-sm leading-6 text-neutral-600">
              <p className="font-medium text-neutral-950">
                {creatorSummary.title}
              </p>
              <p className="mt-2">{creatorSummary.description}</p>
              {"managementHref" in creatorSummary &&
              creatorSummary.managementHref ? (
                <Link
                  className="mt-5 inline-flex rounded-md border border-neutral-300 px-4 py-2 font-semibold text-neutral-950 hover:bg-neutral-50"
                  href={creatorSummary.managementHref}
                >
                  내 광고 상품 관리
                </Link>
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
