import Link from "next/link";
import { redirect } from "next/navigation";
import { CreatorOnboardingDraftCleanup } from "@/components/creator/onboarding-draft-cleanup";
import {
  getPublicHeaderProfileForUser,
  PublicHeader,
} from "@/components/navigation/public-header";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnedCreatorForUser } from "@/lib/creator/owner";
import { getCreatorListings } from "@/lib/creator/listings";

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
  const listings = await getCreatorListings(creator.id);
  const firstListing = listings.at(-1);
  const requestedPublicReview =
    firstListing?.visibilityPreference === "public_review";

  return (
    <main className="brand-page min-h-screen text-neutral-950">
      <CreatorOnboardingDraftCleanup />
      <PublicHeader
        currentPath="/creator/onboarding/complete"
        profile={headerProfile}
      />

      <section className="mx-auto max-w-lg px-4 py-12 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {requestedPublicReview
            ? "첫 광고 자리 공개를 신청했습니다."
            : "첫 광고 자리 등록을 받았습니다."}
        </h1>
        <p className="mt-4 text-sm leading-6 text-neutral-600">
          {requestedPublicReview
            ? "등록 내용을 확인한 뒤 메인에 공개합니다. 보통 1영업일 안에 확인합니다. 공개 전에도 Pyda가 조건에 맞는 광고주를 직접 찾아볼 수 있습니다."
            : "현재 초기 운영 기간에는 메인에 바로 공개하지 않고, Pyda가 조건에 맞는 광고주를 직접 찾아 연결합니다. 광고주가 관심을 보이면 먼저 연락드릴게요."}
        </p>
        <p className="mt-3 text-xs leading-5 text-neutral-500">
          등록한 내용은 언제든 내 광고 자리에서 확인하고 수정할 수 있습니다.
        </p>
        <Link
          className="brand-primary mt-8 inline-flex rounded-md border px-4 py-3 text-sm font-semibold transition"
          href="/account"
        >
          마이페이지로 돌아가기
        </Link>
      </section>
    </main>
  );
}
