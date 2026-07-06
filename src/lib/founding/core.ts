const foundingProgramDays = 100;
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const isoWithTimezonePattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export type FoundingProgramConfig =
  | {
      configured: true;
      startAt: Date;
      endAt: Date;
    }
  | {
      configured: false;
      reason: "missing" | "invalid";
    };

export type FoundingEligibilityInput = {
  program: FoundingProgramConfig;
  onboardedAt: string | null;
  creatorStatus: string;
  isSample: boolean;
  effectivePublicListingCount: number;
  isFounding: boolean;
};

export function parseFoundingProgramStart(value: string | undefined | null): FoundingProgramConfig {
  if (!value) {
    return {
      configured: false,
      reason: "missing",
    };
  }

  if (!isoWithTimezonePattern.test(value)) {
    return {
      configured: false,
      reason: "invalid",
    };
  }

  const startAt = new Date(value);

  if (Number.isNaN(startAt.getTime())) {
    return {
      configured: false,
      reason: "invalid",
    };
  }

  return {
    configured: true,
    startAt,
    endAt: new Date(startAt.getTime() + foundingProgramDays * millisecondsPerDay),
  };
}

export function evaluateFoundingEligibility(input: FoundingEligibilityInput) {
  const onboardingCompleted = input.onboardedAt !== null;
  const onboardedAt = input.onboardedAt ? new Date(input.onboardedAt) : null;
  const validOnboardedAt = Boolean(onboardedAt && !Number.isNaN(onboardedAt.getTime()));
  const withinProgramWindow =
    input.program.configured &&
    validOnboardedAt &&
    onboardedAt !== null &&
    onboardedAt.getTime() >= input.program.startAt.getTime() &&
    onboardedAt.getTime() < input.program.endAt.getTime();
  const hasPublicListing = input.effectivePublicListingCount >= 1;
  const isRealCreator = !input.isSample;

  return {
    programConfigured: input.program.configured,
    onboardingCompleted,
    withinProgramWindow,
    hasPublicListing,
    isRealCreator,
    eligibleForApproval:
      input.program.configured &&
      onboardingCompleted &&
      withinProgramWindow &&
      hasPublicListing &&
      isRealCreator &&
      !input.isFounding,
    alreadyFounding: input.isFounding,
  };
}

export function getEffectivePublicListingCount(input: {
  creatorStatus: string;
  publishedListingCount: number;
}) {
  if (input.creatorStatus !== "published") {
    return 0;
  }

  return input.publishedListingCount;
}

export function buildFoundingApprovalPayload(input: { nowIso: string }) {
  return {
    is_founding: true,
    founding_granted_at: input.nowIso,
  };
}

export function buildFoundingApprovalMatch(input: { creatorId: string }) {
  return {
    id: input.creatorId,
    is_founding: false,
  };
}
