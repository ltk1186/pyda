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

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <p className="text-sm font-semibold text-[var(--brand-ink)]">
          크리에이터 등록
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          내 콘텐츠 속 광고 자리를 판매합니다.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-600">
          영상 전체를 광고로 만들 필요는 없습니다. 영상 속 짧은 소개,
          고정댓글, 프로필 링크처럼 콘텐츠 안의 작은 자리를 열어보세요.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
          현재 초기 운영 기간에는 Pyda가 광고주를 직접 찾아 연결합니다.
          원하면 검토 후 메인에도 공개할 수 있습니다.
        </p>

        <div className="mt-9 grid gap-3 sm:grid-cols-3">
          <SlotExample label="영상 속 30초" type="timeline" />
          <SlotExample label="고정댓글·설명란" type="comment" />
          <SlotExample label="프로필 링크·하이라이트" type="profile" />
        </div>

        <div className="mt-9 max-w-sm">
          <Link
            className="brand-primary block rounded-xl border px-5 py-3.5 text-center text-sm font-semibold transition"
            href="/creator/onboarding"
          >
            내가 팔 수 있는 자리 골라보기
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

function SlotExample({
  label,
  type,
}: {
  label: string;
  type: "timeline" | "comment" | "profile";
}) {
  return (
    <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-4">
      <div
        aria-hidden="true"
        className="h-24 rounded-xl bg-neutral-50 p-4 ring-1 ring-black/5"
      >
        {type === "timeline" ? <TimelineExample /> : null}
        {type === "comment" ? <CommentExample /> : null}
        {type === "profile" ? <ProfileExample /> : null}
      </div>
      <p className="mt-3 text-sm font-semibold text-neutral-900">{label}</p>
    </div>
  );
}

function TimelineExample() {
  return (
    <div className="flex h-full flex-col justify-end">
      <div className="flex-1 rounded-md bg-neutral-200" />
      <div className="mt-3 h-2 rounded-full bg-neutral-200">
        <div className="h-full w-1/3 rounded-full bg-[var(--brand-primary)]" />
      </div>
      <span className="mt-1 text-[10px] font-medium text-[var(--brand-ink)]">
        30초 소개
      </span>
    </div>
  );
}

function CommentExample() {
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <div className="h-2 w-2/5 rounded-full bg-neutral-200" />
      <div className="h-6 rounded-md bg-[var(--brand-soft)] ring-1 ring-[var(--brand-border)]" />
      <div className="h-2 w-4/5 rounded-full bg-neutral-200" />
    </div>
  );
}

function ProfileExample() {
  return (
    <div className="flex h-full items-center gap-3">
      <div className="size-9 shrink-0 rounded-full bg-neutral-200" />
      <div className="flex-1 space-y-2">
        <div className="h-2 w-1/2 rounded-full bg-neutral-200" />
        <div className="h-6 rounded-md bg-[var(--brand-soft)] ring-1 ring-[var(--brand-border)]" />
      </div>
    </div>
  );
}
