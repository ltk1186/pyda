import { redirect } from "next/navigation";
import { CreatorOnboardingForm } from "@/components/creator/onboarding-form";
import {
  getPublicHeaderProfileForUser,
  PublicHeader,
} from "@/components/navigation/public-header";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnedCreatorForUser } from "@/lib/creator/owner";
import { submitCreatorOnboarding } from "./actions";

export const dynamic = "force-dynamic";

export default async function CreatorOnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/creator/onboarding")}`);
  }

  const creator = await getOwnedCreatorForUser(user.id);

  if (creator) {
    redirect("/creator");
  }

  const headerProfile = await getPublicHeaderProfileForUser(user.id);

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <PublicHeader currentPath="/creator/onboarding" profile={headerProfile} />

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          크리에이터 등록
        </h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          운영하는 채널을 입력하고 첫 광고 상품 하나를 등록 신청합니다.
        </p>
        <div className="mt-8">
          <CreatorOnboardingForm action={submitCreatorOnboarding} />
        </div>
      </section>
    </main>
  );
}
