import Image from "next/image";
import Link from "next/link";
import { buildLoginHref, getProfileInitial } from "@/lib/account/core";
import { getAccountProfile } from "@/lib/account/profile";
import { getCurrentUser } from "@/lib/auth/session";

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
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <nav className="flex min-w-0 items-center gap-5">
          <Link className="text-lg font-semibold tracking-tight" href="/">
            Pyda
          </Link>
          <Link
            className="text-sm font-medium text-neutral-700 hover:text-neutral-950"
            href="/account"
          >
            마이페이지
          </Link>
        </nav>

        {profile ? (
          <Link
            className="flex shrink-0 items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-950"
            href="/account"
            aria-label="마이페이지로 이동"
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
            <span className="hidden max-w-28 truncate sm:inline">
              {profile.displayName}
            </span>
          </Link>
        ) : (
          <Link
            className="shrink-0 rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            href={buildLoginHref(currentPath)}
          >
            로그인
          </Link>
        )}
      </div>
    </header>
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
