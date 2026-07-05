"use client";

import { useState } from "react";

export function RequestCta() {
  const [messageVisible, setMessageVisible] = useState(false);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 md:sticky md:top-6">
      <p className="text-base font-semibold text-neutral-950">
        관심 있는 광고가 있으신가요?
        <br />
        처음부터 끝까지 직접 진행을 도와드립니다.
      </p>
      <button
        className="mt-5 w-full rounded-md bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
        type="button"
        onClick={() => setMessageVisible(true)}
      >
        광고 진행하기
      </button>
      {messageVisible ? (
        <p className="mt-3 text-sm text-neutral-600" role="status">
          다음 단계에서 광고 요청 기능이 연결됩니다.
        </p>
      ) : null}
    </div>
  );
}
