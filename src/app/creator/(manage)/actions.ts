"use server";

import { revalidatePath } from "next/cache";
import {
  buildOnboardingCompletePayload,
  canCompleteCreatorOnboarding,
} from "@/lib/creator/core";
import { requireOwnedCreator } from "@/lib/creator/owner";
import { createAdminClient } from "@/lib/supabase/admin";

export type OnboardingCompleteState = {
  message?: string;
  ok?: boolean;
};

export async function completeCreatorOnboarding(
  _state: OnboardingCompleteState,
  _formData?: FormData,
): Promise<OnboardingCompleteState> {
  void _state;
  void _formData;

  const creator = await requireOwnedCreator("/creator");

  if (!creator) {
    return { message: "연결된 크리에이터 프로필이 없습니다." };
  }

  const eligibility = canCompleteCreatorOnboarding({
    creatorStatus: creator.status,
    onboardedAt: creator.onboardedAt,
    nonArchivedListingCount: creator.nonArchivedListingCount,
  });

  if (!eligibility.ok) {
    return { message: eligibility.message };
  }

  const nowIso = new Date().toISOString();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("creators")
    .update(buildOnboardingCompletePayload({ nowIso }))
    .eq("id", creator.id)
    .neq("status", "archived")
    .is("onboarded_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      message: "온보딩 상태가 이미 변경되었습니다. 새로고침 후 다시 확인해주세요.",
    };
  }

  revalidatePath("/creator");
  return { ok: true, message: "온보딩 완료 상태로 저장했습니다." };
}
