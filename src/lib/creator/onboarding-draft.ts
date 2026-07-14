import {
  isOnboardingAdSlot,
  isOnboardingInventoryType,
  isOnboardingOptionKey,
  isOnboardingPlatform,
  validateCreatorOnboardingInput,
  type InstagramExistingPlacement,
  type OnboardingAdSlot,
  type OnboardingInventoryType,
  type OnboardingOptionKey,
  type OnboardingPlatform,
} from "@/lib/creator/onboarding-core";
import {
  isListingVisibilityPreference,
  type ListingVisibilityPreference,
} from "@/lib/listing-visibility";

export const creatorOnboardingDraftKey =
  "pyda.creatorOnboardingDraft.v3";

const creatorOnboardingDraftVersion = 3;

export type CreatorOnboardingDraft = {
  step: 1 | 2 | 3;
  adSlot: OnboardingAdSlot;
  instagramExistingPlacement: InstagramExistingPlacement;
  useDifferentDisplayName: boolean;
  hasSeparateProductionFee: boolean;
  displayName: string;
  bio: string;
  youtubeName: string;
  youtubeUrl: string;
  youtubeAudienceSize: string;
  instagramName: string;
  instagramUrl: string;
  instagramAudienceSize: string;
  selectedPlatform: OnboardingPlatform;
  inventoryType: OnboardingInventoryType;
  optionKeys: OnboardingOptionKey[];
  placementFeeManwon: string;
  productionFeeManwon: string;
  placementFeeTouched: boolean;
  productionFeeTouched: boolean;
  turnaroundDays: string;
  maintenanceDays: string;
  mentionSeconds: string;
  visibilityPreference: ListingVisibilityPreference;
};

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const stringFields = [
  "displayName",
  "bio",
  "youtubeName",
  "youtubeUrl",
  "youtubeAudienceSize",
  "instagramName",
  "instagramUrl",
  "instagramAudienceSize",
  "placementFeeManwon",
  "productionFeeManwon",
  "turnaroundDays",
  "maintenanceDays",
  "mentionSeconds",
] as const;

export function serializeCreatorOnboardingDraft(
  draft: CreatorOnboardingDraft,
) {
  return JSON.stringify({
    version: creatorOnboardingDraftVersion,
    draft,
  });
}

export function parseCreatorOnboardingDraft(raw: string | null) {
  if (!raw) {
    return null;
  }

  try {
    const envelope: unknown = JSON.parse(raw);

    if (!isRecord(envelope) || envelope.version !== creatorOnboardingDraftVersion) {
      return null;
    }

    const draft = envelope.draft;
    if (!isRecord(draft) || !isValidDraftShape(draft)) {
      return null;
    }

    return draft;
  } catch {
    return null;
  }
}

export function readCreatorOnboardingDraft(storage: DraftStorage) {
  try {
    return parseCreatorOnboardingDraft(
      storage.getItem(creatorOnboardingDraftKey),
    );
  } catch {
    return null;
  }
}

export function writeCreatorOnboardingDraft(
  storage: DraftStorage,
  draft: CreatorOnboardingDraft,
) {
  try {
    storage.setItem(
      creatorOnboardingDraftKey,
      serializeCreatorOnboardingDraft(draft),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearCreatorOnboardingDraft(storage: DraftStorage) {
  try {
    storage.removeItem(creatorOnboardingDraftKey);
    return true;
  } catch {
    return false;
  }
}

export function validateCreatorOnboardingDraft(
  draft: CreatorOnboardingDraft,
) {
  return validateCreatorOnboardingInput({
    adSlot: draft.adSlot,
    displayName: draft.displayName,
    bio: draft.bio,
    youtubeName: draft.youtubeName,
    youtubeUrl: draft.youtubeUrl,
    youtubeAudienceSize: draft.youtubeAudienceSize,
    instagramName: draft.instagramName,
    instagramUrl: draft.instagramUrl,
    instagramAudienceSize: draft.instagramAudienceSize,
    selectedPlatform: draft.selectedPlatform,
    inventoryType: draft.inventoryType,
    optionKeys: draft.optionKeys,
    placementFeeManwon: draft.placementFeeManwon,
    productionFeeManwon: draft.hasSeparateProductionFee
      ? draft.productionFeeManwon
      : "0",
    turnaroundDays: draft.turnaroundDays,
    maintenanceDays: draft.maintenanceDays,
    mentionSeconds: draft.mentionSeconds,
    storyCount: "",
    visibilityPreference: draft.visibilityPreference,
  });
}

function isValidDraftShape(
  value: Record<string, unknown>,
): value is CreatorOnboardingDraft {
  if (
    (value.step !== 1 && value.step !== 2 && value.step !== 3) ||
    typeof value.adSlot !== "string" ||
    !isOnboardingAdSlot(value.adSlot) ||
    (value.instagramExistingPlacement !== "profile_link" &&
      value.instagramExistingPlacement !== "highlight") ||
    typeof value.useDifferentDisplayName !== "boolean" ||
    typeof value.hasSeparateProductionFee !== "boolean" ||
    typeof value.placementFeeTouched !== "boolean" ||
    typeof value.productionFeeTouched !== "boolean" ||
    typeof value.selectedPlatform !== "string" ||
    !isOnboardingPlatform(value.selectedPlatform) ||
    typeof value.inventoryType !== "string" ||
    !isOnboardingInventoryType(value.inventoryType) ||
    typeof value.visibilityPreference !== "string" ||
    !isListingVisibilityPreference(value.visibilityPreference) ||
    !Array.isArray(value.optionKeys)
  ) {
    return false;
  }

  if (
    !stringFields.every((field) => typeof value[field] === "string") ||
    !value.optionKeys.every(
      (optionKey) =>
        typeof optionKey === "string" && isOnboardingOptionKey(optionKey),
    ) ||
    new Set(value.optionKeys).size !== value.optionKeys.length
  ) {
    return false;
  }

  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
