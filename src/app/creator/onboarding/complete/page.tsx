import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getPublicHeaderProfileForUser,
  PublicHeader,
} from "@/components/navigation/public-header";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnedCreatorForUser } from "@/lib/creator/owner";

export const dynamic = "force-dynamic";

export default async function CreatorOnboardingCompletePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/creator/onboarding/complete")}`);
  }

  const creator = await getOwnedCreatorForUser(user.id);

  if (!creator) {
    redirect("/creator/start");
  }

  if (!creator.onboardedAt) {
    redirect("/creator");
  }

  const headerProfile = await getPublicHeaderProfileForUser(user.id);

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <PublicHeader
        currentPath="/creator/onboarding/complete"
        profile={headerProfile}
      />

      <section className="mx-auto max-w-lg px-4 py-12 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          등록 신청이 완료되었습니다.
        </h1>
        <p className="mt-4 text-sm leading-6 text-neutral-600">
          채널과 광고 상품을 확인한 뒤 공개됩니다.
        </p>
        <Link
          className="mt-8 inline-flex rounded-md bg-neutral-950 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
          href="/account"
        >
          마이페이지로 돌아가기
        </Link>
      </section>
    </main>
  );
}
