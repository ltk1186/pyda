import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getPublicHeaderProfileForUser,
  PublicHeader,
} from "@/components/navigation/public-header";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdvertiserRequestById } from "@/lib/requests/data";
import {
  formatPreferredSchedule,
  formatRequestDate,
  formatRequestStatus,
} from "@/lib/requests";
import { readKakaoOpenChatUrl } from "@/lib/requests/open-chat";

export const dynamic = "force-dynamic";

type AccountRequestDetailProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AccountRequestDetailPage({
  params,
}: AccountRequestDetailProps) {
  const user = await getCurrentUser();

  if (!user) {
    const { id } = await params;
    redirect(`/login?next=${encodeURIComponent(`/account/requests/${id}`)}`);
  }

  const { id } = await params;
  const request = await getAdvertiserRequestById(user.id, id);

  if (!request) {
    notFound();
  }

  const headerProfile = await getPublicHeaderProfileForUser(user.id);
  const kakaoOpenChatUrl = readKakaoOpenChatUrl();

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <PublicHeader
        currentPath={`/account/requests/${request.id}`}
        profile={headerProfile}
      />

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          className="text-sm text-neutral-600 hover:text-neutral-950"
          href="/account/requests"
        >
          내 광고 요청
        </Link>

        <div className="mt-6 border-y border-neutral-200 py-6">
          <p className="text-sm font-medium text-neutral-600">
            {formatRequestStatus(request.status)}
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            {request.listingTitle}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            요청일 {formatRequestDate(request.createdAt)}
          </p>
        </div>

        {request.contactChannel === "카카오톡" && kakaoOpenChatUrl ? (
          <section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
            <p className="text-base font-semibold text-neutral-950">
              요청이 접수되었습니다.
            </p>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              바로 Pyda와 카카오톡으로 이야기하면서 일정과 조건을 조율할 수 있습니다.
            </p>
            <Link
              className="mt-5 inline-flex rounded-md bg-neutral-950 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
              href={kakaoOpenChatUrl}
            >
              카카오톡으로 바로 이야기하기
            </Link>
          </section>
        ) : null}

        {request.contactChannel === "전화" ? (
          <section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
            <p className="text-base font-semibold text-neutral-950">
              요청이 접수되었습니다.
            </p>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              남겨주신 휴대전화번호로 연락드릴게요.
            </p>
          </section>
        ) : null}

        <dl className="mt-8 grid gap-6 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">브랜드명</dt>
            <dd className="mt-1 font-medium text-neutral-950">
              {request.brandName}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">희망 일정</dt>
            <dd className="mt-1 font-medium text-neutral-950">
              {formatPreferredSchedule(
                request.preferredStartDate,
                request.preferredEndDate,
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-neutral-500">요청 내용</dt>
            <dd className="mt-2 whitespace-pre-wrap leading-7 text-neutral-700">
              {request.campaignBrief}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
