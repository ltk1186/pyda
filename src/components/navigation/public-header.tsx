import Image from "next/image";
import Link from "next/link";
import { buildLoginHref, getProfileInitial } from "@/lib/account/core";
import { getAccountProfile } from "@/lib/account/profile";
import { getCurrentUser } from "@/lib/auth/session";
import { PublicHeaderMenu } from "./public-header-menu";

type PublicHeaderProps = {
  currentPath: string;
  profile: PublicHeaderProfile | null;
};

export type PublicHeaderProfile = {
  displayName: string;
  avatarUrl: string | null;
};

export async function getPublicHeaderViewer() {
  const user = await getCurrentUser();
  return user ? getPublicHeaderProfileForUser(user.id) : null;
}

export async function getPublicHeaderProfileForUser(userId: string) {
  return getHeaderProfile(userId);
}

export function PublicHeader({ currentPath, profile }: PublicHeaderProps) {
  const loginHref = buildLoginHref(currentPath);

  return (
    <header className="sticky top-0 z-40 px-3 py-3 sm:px-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-full border border-neutral-200/80 bg-white/90 px-4 py-2.5 shadow-[0_1px_10px_rgba(0,0,0,0.04)] backdrop-blur-sm sm:px-5">
        <Link
          className="text-base font-semibold tracking-tight text-neutral-950"
          href="/"
        >
          Pyda
        </Link>

        <nav
          className="hidden shrink-0 items-center gap-5 text-sm font-medium text-neutral-700 md:flex"
          aria-label="공개 메뉴"
        >
          <Link className="hover:text-neutral-950" href="/how-it-works">
            이용 방법
          </Link>
          {profile ? (
            <ProfileLink profile={profile} />
          ) : (
            <>
              <Link className="hover:text-neutral-950" href="/creator/start">
                크리에이터 등록하기
              </Link>
              <Link
                className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                href={loginHref}
              >
                로그인
              </Link>
            </>
          )}
        </nav>

        <div className="md:hidden">
          <PublicHeaderMenu
            loginHref={loginHref}
            profile={profile}
            profileInitial={
              profile ? getProfileInitial(profile.displayName) : null
            }
          />
        </div>
      </div>
    </header>
  );
}

function ProfileLink({ profile }: { profile: PublicHeaderProfile }) {
  return (
    <Link
      className="flex shrink-0 items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-950"
      href="/account"
      aria-label="계정으로 이동"
    >
      {profile.avatarUrl ? (
        <Image
          className="h-8 w-8 rounded-full bg-neutral-100 object-cover"
          src={profile.avatarUrl}
          alt=""
          width={32}
          height={32}
          unoptimized
        />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700">
          {getProfileInitial(profile.displayName)}
        </span>
      )}
      <span className="max-w-28 truncate">{profile.displayName}</span>
    </Link>
  );
}

async function getHeaderProfile(userId: string) {
  try {
    return await getAccountProfile(userId);
  } catch {
    return {
      displayName: "프로필",
      avatarUrl: null,
    };
  }
}
