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

type CreatorOnboardingPageProps = {
  searchParams?: Promise<{ resume?: string | string[] }>;
};

export default async function CreatorOnboardingPage({
  searchParams = Promise.resolve({}),
}: CreatorOnboardingPageProps = {}) {
  const user = await getCurrentUser();
  const creator = user ? await getOwnedCreatorForUser(user.id) : null;

  if (creator) {
    redirect("/creator");
  }

  const headerProfile = user
    ? await getPublicHeaderProfileForUser(user.id)
    : null;
  const params = await searchParams;
  const resume = Array.isArray(params.resume) ? params.resume[0] : params.resume;
  const resumeRequested = resume === "1";
  const currentPath = resumeRequested
    ? "/creator/onboarding?resume=1"
    : "/creator/onboarding";

  return (
    <main className="brand-page min-h-screen text-neutral-950">
      <PublicHeader currentPath={currentPath} profile={headerProfile} />

      <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <CreatorOnboardingForm
          action={submitCreatorOnboarding}
          isAuthenticated={Boolean(user)}
        />
      </section>
    </main>
  );
}
