"use client";

import { useEffect } from "react";
import { clearCreatorOnboardingDraft } from "@/lib/creator/onboarding-draft";

export function CreatorOnboardingDraftCleanup() {
  useEffect(() => {
    try {
      clearCreatorOnboardingDraft(window.sessionStorage);
    } catch {
      // A completed onboarding must not fail when browser storage is unavailable.
    }
  }, []);

  return null;
}
