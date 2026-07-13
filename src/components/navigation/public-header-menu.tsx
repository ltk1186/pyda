"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PublicHeaderProfile } from "./public-header";

type PublicHeaderMenuProps = {
  loginHref: string;
  profile: PublicHeaderProfile | null;
  profileInitial: string | null;
};

export function PublicHeaderMenu({
  loginHref,
  profile,
  profileInitial,
}: PublicHeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-label="메뉴 열기"
        className="brand-outline rounded-full border px-3 py-1.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-ink)]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        메뉴
      </button>
      {open ? (
        <MenuContent
          loginHref={loginHref}
          onNavigate={() => setOpen(false)}
          profile={profile}
          profileInitial={profileInitial}
        />
      ) : null}
    </div>
  );
}

function MenuContent({
  loginHref,
  onNavigate,
  profile,
  profileInitial,
}: {
  loginHref: string;
  onNavigate: () => void;
  profile: PublicHeaderProfile | null;
  profileInitial: string | null;
}) {
  return (
    <nav
      className="absolute right-0 top-12 w-56 rounded-2xl border border-neutral-200 bg-white p-2 text-sm font-medium text-neutral-700 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
      aria-label="모바일 공개 메뉴"
    >
      <Link
        className="block rounded-xl px-3 py-2.5 hover:bg-neutral-50 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
        href="/how-it-works"
        onClick={onNavigate}
      >
        이용 방법
      </Link>
      {profile ? (
        <Link
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-neutral-50 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          href="/account"
          onClick={onNavigate}
        >
          {profile.avatarUrl ? (
            <Image
              className="h-7 w-7 rounded-full bg-neutral-100 object-cover"
              src={profile.avatarUrl}
              alt=""
              width={28}
              height={28}
              unoptimized
            />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-semibold text-[var(--brand-ink)]">
              {profileInitial}
            </span>
          )}
          계정으로 이동
        </Link>
      ) : (
        <>
          <Link
            className="block rounded-xl px-3 py-2.5 hover:bg-neutral-50 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
            href="/creator/start"
            onClick={onNavigate}
          >
            크리에이터 등록하기
          </Link>
          <Link
            className="block rounded-xl px-3 py-2.5 hover:bg-neutral-50 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
            href={loginHref}
            onClick={onNavigate}
          >
            로그인
          </Link>
        </>
      )}
    </nav>
  );
}
