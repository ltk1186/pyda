export const customAdBudgetRanges = [
  "under_50k",
  "50k_100k",
  "100k_300k",
  "300k_500k",
  "500k_1m",
  "over_1m",
  "unknown",
] as const;

export const customAdDesiredTimings = [
  "asap",
  "within_1_month",
  "within_1_to_3_months",
  "undecided",
] as const;

export const customAdContactMethods = ["kakao", "phone"] as const;

export type CustomAdBudgetRange = (typeof customAdBudgetRanges)[number];
export type CustomAdDesiredTiming = (typeof customAdDesiredTimings)[number];
export type CustomAdContactMethod = (typeof customAdContactMethods)[number];

export const customAdBudgetLabels: Record<CustomAdBudgetRange, string> = {
  under_50k: "5만원 미만",
  "50k_100k": "5만~10만원",
  "100k_300k": "10만~30만원",
  "300k_500k": "30만~50만원",
  "500k_1m": "50만~100만원",
  over_1m: "100만원 이상",
  unknown: "아직 모르겠어요",
};

export const customAdTimingLabels: Record<CustomAdDesiredTiming, string> = {
  asap: "가능한 빨리",
  within_1_month: "1개월 안",
  within_1_to_3_months: "1~3개월 안",
  undecided: "아직 미정",
};

export const customAdContactMethodLabels: Record<CustomAdContactMethod, string> =
  {
    kakao: "카카오톡",
    phone: "전화",
  };

export type CustomAdRequestInput = {
  advertisedItem: string;
  requestDetails: string;
  creatorPreferences: string | null;
  budgetRange: CustomAdBudgetRange;
  desiredTiming: CustomAdDesiredTiming;
  contactMethod: CustomAdContactMethod;
  phone: string;
  privacyConsent: true;
};

export type CustomAdRequestErrors = Partial<
  Record<keyof CustomAdRequestInput, string>
>;

export type CustomAdRequestInsertPayload = {
  user_id: string | null;
  advertised_item: string;
  request_details: string;
  creator_preferences: string | null;
  budget_range: CustomAdBudgetRange;
  desired_timing: CustomAdDesiredTiming;
  contact_method: CustomAdContactMethod;
  phone: string;
  source: "homepage_concierge";
  status: "submitted";
};

const advertisedItemMaxLength = 100;
const requestDetailsMaxLength = 1500;
const creatorPreferencesMaxLength = 500;

export function parseCustomAdRequestFormData(formData: FormData) {
  return validateCustomAdRequestInput({
    advertisedItem: stringValue(formData.get("advertisedItem")),
    requestDetails: stringValue(formData.get("requestDetails")),
    creatorPreferences: stringValue(formData.get("creatorPreferences")),
    budgetRange: stringValue(formData.get("budgetRange")),
    desiredTiming: stringValue(formData.get("desiredTiming")),
    contactMethod: stringValue(formData.get("contactMethod")),
    phone: stringValue(formData.get("phone")),
    privacyConsent: formData.get("privacyConsent") === "on",
  });
}

export function validateCustomAdRequestInput(input: Record<string, unknown>) {
  const errors: CustomAdRequestErrors = {};
  const advertisedItem = stringValue(input.advertisedItem).trim();
  const requestDetails = stringValue(input.requestDetails).trim();
  const creatorPreferences = stringValue(input.creatorPreferences).trim();
  const budgetRange = stringValue(input.budgetRange);
  const desiredTiming = stringValue(input.desiredTiming);
  const contactMethod = stringValue(input.contactMethod);
  const normalizedPhone = normalizePhone(input.phone);

  if (!advertisedItem) {
    errors.advertisedItem = "광고할 매장, 상품 또는 서비스 이름을 입력해주세요.";
  } else if (advertisedItem.length > advertisedItemMaxLength) {
    errors.advertisedItem = `광고 대상은 ${advertisedItemMaxLength}자 이내로 입력해주세요.`;
  }

  if (!requestDetails) {
    errors.requestDetails = "원하는 광고 내용을 입력해주세요.";
  } else if (requestDetails.length > requestDetailsMaxLength) {
    errors.requestDetails = `광고 내용은 ${requestDetailsMaxLength}자 이내로 입력해주세요.`;
  }

  if (creatorPreferences.length > creatorPreferencesMaxLength) {
    errors.creatorPreferences = `크리에이터 조건은 ${creatorPreferencesMaxLength}자 이내로 입력해주세요.`;
  }

  if (!isCustomAdBudgetRange(budgetRange)) {
    errors.budgetRange = "예상 예산을 선택해주세요.";
  }

  if (!isCustomAdDesiredTiming(desiredTiming)) {
    errors.desiredTiming = "희망 시기를 선택해주세요.";
  }

  if (!isCustomAdContactMethod(contactMethod)) {
    errors.contactMethod = "연락 방법을 선택해주세요.";
  }

  if (!normalizedPhone) {
    errors.phone = "휴대전화번호를 입력해주세요.";
  } else if (!isValidKoreanMobilePhone(normalizedPhone)) {
    errors.phone = "휴대전화번호를 확인해주세요.";
  }

  if (input.privacyConsent !== true) {
    errors.privacyConsent = "연락처 수집에 동의해주세요.";
  }

  if (
    Object.keys(errors).length > 0 ||
    !isCustomAdBudgetRange(budgetRange) ||
    !isCustomAdDesiredTiming(desiredTiming) ||
    !isCustomAdContactMethod(contactMethod) ||
    !normalizedPhone
  ) {
    return {
      ok: false as const,
      errors,
    };
  }

  return {
    ok: true as const,
    data: {
      advertisedItem,
      requestDetails,
      creatorPreferences: creatorPreferences || null,
      budgetRange,
      desiredTiming,
      contactMethod,
      phone: normalizedPhone,
      privacyConsent: true,
    } satisfies CustomAdRequestInput,
  };
}

export function buildCustomAdRequestInsertPayload(input: {
  request: CustomAdRequestInput;
  userId: string | null;
}): CustomAdRequestInsertPayload {
  return {
    user_id: input.userId,
    advertised_item: input.request.advertisedItem,
    request_details: input.request.requestDetails,
    creator_preferences: input.request.creatorPreferences,
    budget_range: input.request.budgetRange,
    desired_timing: input.request.desiredTiming,
    contact_method: input.request.contactMethod,
    phone: input.request.phone,
    source: "homepage_concierge",
    status: "submitted",
  };
}

export function isCustomAdBudgetRange(
  value: string,
): value is CustomAdBudgetRange {
  return customAdBudgetRanges.includes(value as CustomAdBudgetRange);
}

export function isCustomAdDesiredTiming(
  value: string,
): value is CustomAdDesiredTiming {
  return customAdDesiredTimings.includes(value as CustomAdDesiredTiming);
}

export function isCustomAdContactMethod(
  value: string,
): value is CustomAdContactMethod {
  return customAdContactMethods.includes(value as CustomAdContactMethod);
}

export function normalizePhone(value: unknown) {
  const string = stringValue(value);
  const digits = string.replace(/[^\d]/g, "");
  return digits.length > 0 ? digits : null;
}

function isValidKoreanMobilePhone(value: string) {
  return /^01[016789]\d{7,8}$/.test(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
