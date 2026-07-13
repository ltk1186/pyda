import Link from "next/link";
import { redirect } from "next/navigation";
import { KakaoLoginButton } from "@/components/auth/kakao-login-button";
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

      <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          크리에이터로 시작하기
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-600">
          내 콘텐츠에서 판매할 광고 방식과 가격을 직접 정하세요.
        </p>

        <ol className="mt-8 space-y-3 text-sm leading-6 text-neutral-700">
          <li>1. 내 채널을 등록합니다.</li>
          <li>2. 판매할 광고 상품 하나를 선택합니다.</li>
          <li>3. 가격을 정하고 등록을 신청합니다.</li>
        </ol>

        <div className="mt-8 max-w-sm">
          {!user ? (
            <KakaoLoginButton nextPath="/creator/onboarding" />
          ) : (
            <Link
              className="brand-primary block rounded-md border px-4 py-3 text-center text-sm font-semibold transition"
              href="/creator/onboarding"
            >
              크리에이터 등록 시작하기
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
