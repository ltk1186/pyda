"use client";

import { useState } from "react";

type KakaoLoginButtonProps = {
  nextPath: string;
};

export function buildKakaoStartPath(nextPath: string) {
  return `/auth/kakao/start?next=${encodeURIComponent(nextPath)}`;
}

export function KakaoLoginButton({ nextPath }: KakaoLoginButtonProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signInWithKakao() {
    setErrorMessage(null);
    setPending(true);

    try {
      window.location.assign(buildKakaoStartPath(nextPath));
    } catch {
      setPending(false);
      setErrorMessage(
        "카카오 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
    }
  }

  return (
    <div>
      <button
        className="w-full rounded-md bg-[#FEE500] px-4 py-3.5 text-sm font-semibold text-[#191919] transition disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        onClick={() => void signInWithKakao()}
        type="button"
      >
        {pending ? "카카오로 연결 중" : "카카오로 시작하기"}
      </button>
      {errorMessage ? (
        <p className="mt-3 text-sm text-neutral-600" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
