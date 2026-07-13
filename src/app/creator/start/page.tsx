import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getPublicHeaderProfileForUser,
  PublicHeader,
} from "@/components/navigation/public-header";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnedCreatorForUser } from "@/lib/creator/owner";

export const dynamic = "force-dynamic";

export default async function CreatorStartPage() {
  const user = await getCurrentUser();
  const creator = user ? await getOwnedCreatorForUser(user.id) : null;

  if (creator) {
    redirect("/creator");
  }

  const headerProfile = user ? await getPublicHeaderProfileForUser(user.id) : null;

  return (
    <main className="brand-page min-h-screen text-neutral-950">
      <PublicHeader currentPath="/creator/start" profile={headerProfile} />

      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <p className="text-sm font-semibold text-[var(--brand-ink)]">
          크리에이터 등록
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          내 콘텐츠의 광고 자리를 등록해보세요
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-600">
          운영하는 채널과 판매할 광고 방식을 로그인 전에 먼저 입력해볼 수
          있습니다.
        </p>

        <div className="brand-soft mt-8 rounded-2xl border border-[var(--brand-border)] p-5">
          <ol className="space-y-3 text-sm leading-6 text-neutral-700">
            <li>1. 운영하는 채널을 알려주세요.</li>
            <li>2. 판매할 광고 방식 하나를 선택하세요.</li>
            <li>3. 추천 가격에서 시작해 희망 가격을 정하세요.</li>
          </ol>
        </div>

        <div className="mt-8 max-w-sm">
          <Link
            className="brand-primary block rounded-xl border px-5 py-3.5 text-center text-sm font-semibold transition"
            href="/creator/onboarding"
          >
            3분 만에 광고 자리 등록하기
          </Link>
          <p className="mt-3 text-center text-xs leading-5 text-neutral-500">
            등록 신청을 완료할 때 카카오 계정 연결이 필요합니다. 연결 전에는
            작성 내용이 제출되지 않습니다.
          </p>
        </div>
      </section>
    </main>
  );
}
