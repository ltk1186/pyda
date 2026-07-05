export const contactChannels = [
  "카카오톡",
  "전화 또는 문자",
  "이메일",
  "WhatsApp",
] as const;

export type ContactChannel = (typeof contactChannels)[number];

export type RequestFormInput = {
  brandName: string;
  contactName: string;
  contactChannel: ContactChannel;
  contactValue: string;
  campaignBrief: string;
  preferredStartDate: string | null;
  preferredEndDate: string | null;
};

export type RequestFormErrors = Partial<Record<keyof RequestFormInput, string>>;

export type RequestInsertPayload = {
  advertiser_user_id: string;
  listing_id: string;
  brand_name: string;
  contact_name: string;
  contact_channel: ContactChannel;
  contact_value: string;
  campaign_brief: string;
  preferred_start_date: string | null;
  preferred_end_date: string | null;
  quoted_amount_krw: null;
  status: "submitted";
  admin_notes: null;
};

export function parseRequestFormData(formData: FormData) {
  return validateRequestForm({
    brandName: stringValue(formData.get("brandName")),
    contactName: stringValue(formData.get("contactName")),
    contactChannel: stringValue(formData.get("contactChannel")),
    contactValue: stringValue(formData.get("contactValue")),
    campaignBrief: stringValue(formData.get("campaignBrief")),
    preferredStartDate: nullableStringValue(formData.get("preferredStartDate")),
    preferredEndDate: nullableStringValue(formData.get("preferredEndDate")),
  });
}

export function validateRequestForm(input: Record<string, string | null>) {
  const errors: RequestFormErrors = {};
  const contactChannel = input.contactChannel;

  if (!input.brandName?.trim()) {
    errors.brandName = "회사 또는 브랜드명을 입력해주세요.";
  }

  if (!input.contactName?.trim()) {
    errors.contactName = "담당자명을 입력해주세요.";
  }

  if (!isContactChannel(contactChannel)) {
    errors.contactChannel = "선호 연락 방식을 선택해주세요.";
  }

  if (!input.contactValue?.trim()) {
    errors.contactValue = "연락처를 입력해주세요.";
  }

  if (!input.campaignBrief?.trim()) {
    errors.campaignBrief = "진행하고 싶은 광고 내용을 입력해주세요.";
  }

  if (
    input.preferredStartDate &&
    input.preferredEndDate &&
    input.preferredStartDate > input.preferredEndDate
  ) {
    errors.preferredEndDate = "희망 종료일은 시작일 이후여야 합니다.";
  }

  if (Object.keys(errors).length > 0 || !isContactChannel(contactChannel)) {
    return {
      ok: false as const,
      errors,
    };
  }

  return {
    ok: true as const,
    data: {
      brandName: input.brandName?.trim() ?? "",
      contactName: input.contactName?.trim() ?? "",
      contactChannel,
      contactValue: input.contactValue?.trim() ?? "",
      campaignBrief: input.campaignBrief?.trim() ?? "",
      preferredStartDate: input.preferredStartDate || null,
      preferredEndDate: input.preferredEndDate || null,
    } satisfies RequestFormInput,
  };
}

export function buildRequestInsertPayload(
  input: RequestFormInput,
  userId: string,
  listingId: string,
): RequestInsertPayload {
  return {
    advertiser_user_id: userId,
    listing_id: listingId,
    brand_name: input.brandName,
    contact_name: input.contactName,
    contact_channel: input.contactChannel,
    contact_value: input.contactValue,
    campaign_brief: input.campaignBrief,
    preferred_start_date: input.preferredStartDate,
    preferred_end_date: input.preferredEndDate,
    quoted_amount_krw: null,
    status: "submitted",
    admin_notes: null,
  };
}

function isContactChannel(value: string | null): value is ContactChannel {
  return contactChannels.includes(value as ContactChannel);
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function nullableStringValue(value: FormDataEntryValue | null) {
  const string = stringValue(value).trim();
  return string.length > 0 ? string : null;
}
