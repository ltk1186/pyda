"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type OAuthButtonsProps = {
  nextPath: string;
};

type Provider = "google" | "kakao";

export function OAuthButtons({ nextPath }: OAuthButtonsProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function signIn(provider: Provider) {
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) {
        setErrorMessage("로그인을 시작하지 못했습니다. 설정을 확인해주세요.");
      }
    } catch {
      setErrorMessage("Supabase 환경변수가 없어 로그인을 시작할 수 없습니다.");
    }
  }

  return (
    <div className="space-y-3">
      <button
        className="w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-950 transition hover:border-neutral-500"
        type="button"
        onClick={() => void signIn("google")}
      >
        Google로 계속하기
      </button>
      <button
        className="w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-950 transition hover:border-neutral-500"
        type="button"
        onClick={() => void signIn("kakao")}
      >
        Kakao로 계속하기
      </button>
      {errorMessage ? (
        <p className="text-sm text-neutral-600" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
