import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClaimButton } from "@/components/claim/claim-button";
import { getCurrentUser } from "@/lib/auth/session";
import { getClaimLoginNextPath } from "@/lib/claim/core";
import {
  getConnectedCreatorCount,
  getValidClaimCreator,
} from "@/lib/claim/data";
import { getClaimIntentToken } from "@/lib/claim/intent";
import { claimCreatorFromIntent } from "./actions";

type ClaimResumePageProps = {
  searchParams: Promise<{
    invalid?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

export default async function ClaimResumePage({
  searchParams,
}: ClaimResumePageProps) {
  const params = await searchParams;

  if (getSingleParam(params.invalid)) {
    return <InvalidClaimIntent />;
  }

  const rawToken = await getClaimIntentToken();

  if (!rawToken) {
    redirect("/claim/resume/invalid");
  }

  const creator = await getValidClaimCreator(rawToken);

  if (!creator) {
    redirect("/claim/resume/invalid");
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(getClaimLoginNextPath())}`);
  }

  const connectedCreatorCount = await getConnectedCreatorCount(user.id);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-12 text-neutral-950">
      <section className="w-full max-w-md rounded-lg border border-neutral-200 p-6">
        <Link className="text-lg font-semibold" href="/">
          Pyda
        </Link>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">
          {creator.displayName}
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          관리자가 미리 준비한 크리에이터 프로필입니다. 아래 버튼을 누르면
          현재 로그인한 계정에 이 프로필을 연결합니다.
        </p>
        {connectedCreatorCount > 0 ? (
          <p className="mt-6 rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
            이미 다른 크리에이터 프로필이 연결된 계정입니다.
          </p>
        ) : (
          <div className="mt-7">
            <ClaimButton action={claimCreatorFromIntent} />
          </div>
        )}
      </section>
    </main>
  );
}

function InvalidClaimIntent() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-12 text-neutral-950">
      <section className="w-full max-w-md rounded-lg border border-neutral-200 p-6">
        <h1 className="text-xl font-semibold">온보딩 링크 오류</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          이 온보딩 링크는 유효하지 않거나 만료되었습니다.
        </p>
        <Link className="mt-6 inline-block text-sm font-medium" href="/">
          Pyda 홈으로 이동
        </Link>
      </section>
    </main>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
