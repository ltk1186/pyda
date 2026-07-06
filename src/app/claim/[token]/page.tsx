import Link from "next/link";
import type { Metadata } from "next";
import { ClaimButton } from "@/components/claim/claim-button";
import { getValidClaimCreator } from "@/lib/claim/data";
import { startClaimIntent } from "./actions";

type ClaimPageProps = {
  params: Promise<{
    token: string;
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

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { token } = await params;
  const creator = await getValidClaimCreator(token);

  if (!creator) {
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
          관리자가 미리 준비한 크리에이터 프로필입니다. 로그인한 현재
          계정에 이 프로필을 연결할 수 있습니다. 계속하면 보안용 임시
          온보딩 상태를 만든 뒤 로그인 또는 계정 연결 단계로 이동합니다.
        </p>
        <div className="mt-7">
          <ClaimButton
            action={startClaimIntent.bind(null, token)}
            label="온보딩 계속하기"
            pendingLabel="확인 중"
          />
        </div>
      </section>
    </main>
  );
}
