import {
  getPublicHeaderViewer,
  PublicHeader,
} from "@/components/navigation/public-header";
import { CustomAdRequestForm } from "@/components/advertise/custom-ad-request-form";
import { sanitizeCustomAdSource } from "@/lib/custom-ad-requests/core";
import { submitCustomAdRequestAction } from "./actions";

export const dynamic = "force-dynamic";

type AdvertisePageProps = {
  searchParams?: Promise<{
    src?: string | string[];
  }>;
};

export default async function AdvertisePage({
  searchParams,
}: AdvertisePageProps = {}) {
  const headerProfile = await getPublicHeaderViewer();
  const params = searchParams ? await searchParams : {};
  const source = sanitizeCustomAdSource(getFirstParam(params.src));

  return (
    <main className="brand-page min-h-screen text-neutral-950">
      <PublicHeader currentPath="/advertise" profile={headerProfile} />

      <section className="mx-auto flex min-h-[calc(100svh-76px)] max-w-3xl items-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <CustomAdRequestForm action={submitCustomAdRequestAction} source={source} />
      </section>
    </main>
  );
}

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
