"use server";

import { redirect } from "next/navigation";
import { claimResumePath } from "@/lib/claim/core";
import { getValidClaimCreator } from "@/lib/claim/data";
import { setClaimIntentCookie } from "@/lib/claim/intent";

export type ClaimActionState = {
  message?: string;
};

export async function startClaimIntent(
  rawToken: string,
  _state: ClaimActionState,
  _formData?: FormData,
): Promise<ClaimActionState> {
  void _state;
  void _formData;

  const creator = await getValidClaimCreator(rawToken);

  if (!creator) {
    return { message: "이 온보딩 링크는 유효하지 않거나 만료되었습니다." };
  }

  await setClaimIntentCookie(rawToken);
  redirect(claimResumePath);
}
