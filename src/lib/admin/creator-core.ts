export const creatorStatuses = [
  "draft",
  "published",
  "hidden",
  "archived",
] as const;

export const socialLinkKeys = ["youtube", "instagram", "blog", "tiktok"] as const;

export type CreatorStatus = (typeof creatorStatuses)[number];
export type SocialLinkKey = (typeof socialLinkKeys)[number];
export type CreatorSocialLinks = Partial<Record<SocialLinkKey, string>>;

export type AdminCreatorFormInput = {
  displayName: string;
  slug: string;
  bio: string | null;
  socialLinks: CreatorSocialLinks;
  status: CreatorStatus;
  isSample: boolean;
};

export type AdminCreatorFormErrors = Partial<
  Record<"displayName" | "slug" | "status", string>
>;

export type AdminCreatorInsertPayload = {
  owner_user_id: null;
  slug: string;
  display_name: string;
  bio: string | null;
  avatar_path: null;
  social_links: CreatorSocialLinks;
  status: CreatorStatus;
  is_sample: boolean;
  onboarded_at: null;
  claimed_at: null;
  claim_token_hash: null;
  claim_expires_at: null;
  is_founding: false;
  founding_granted_at: null;
};

export type AdminCreatorUpdatePayload = {
  slug: string;
  display_name: string;
  bio: string | null;
  social_links: CreatorSocialLinks;
  status: CreatorStatus;
  is_sample: boolean;
};

const creatorStatusLabels: Record<CreatorStatus, string> = {
  draft: "작성 중",
  published: "공개",
  hidden: "숨김",
  archived: "보관",
};

const socialLinkLabels: Record<SocialLinkKey, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  blog: "네이버 블로그",
  tiktok: "TikTok",
};

export function parseAdminCreatorFormData(formData: FormData) {
  return validateAdminCreatorForm({
    displayName: stringValue(formData.get("displayName")),
    slug: stringValue(formData.get("slug")),
    bio: nullableStringValue(formData.get("bio")),
    youtube: nullableStringValue(formData.get("youtube")),
    instagram: nullableStringValue(formData.get("instagram")),
    blog: nullableStringValue(formData.get("blog")),
    tiktok: nullableStringValue(formData.get("tiktok")),
    status: stringValue(formData.get("status")),
    isSample: formData.get("isSample") === "on",
  });
}

export function validateAdminCreatorForm(input: Record<string, unknown>) {
  const errors: AdminCreatorFormErrors = {};
  const displayName = stringValue(input.displayName).trim();
  const slug = stringValue(input.slug).trim();
  const status = stringValue(input.status);

  if (!displayName) {
    errors.displayName = "활동명을 입력해주세요.";
  }

  if (!isValidCreatorSlug(slug)) {
    errors.slug =
      "slug는 영문 소문자, 숫자, 하이픈만 사용할 수 있고 하이픈으로 시작하거나 끝날 수 없습니다.";
  }

  if (!isCreatorStatus(status)) {
    errors.status = "공개 상태를 선택해주세요.";
  }

  if (Object.keys(errors).length > 0 || !isCreatorStatus(status)) {
    return {
      ok: false as const,
      errors,
    };
  }

  return {
    ok: true as const,
    data: {
      displayName,
      slug,
      bio: nullableStringValue(input.bio),
      socialLinks: cleanSocialLinks({
        youtube: input.youtube,
        instagram: input.instagram,
        blog: input.blog,
        tiktok: input.tiktok,
      }),
      status,
      isSample: input.isSample === true,
    } satisfies AdminCreatorFormInput,
  };
}

export function isValidCreatorSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function cleanSocialLinks(
  input: Partial<Record<SocialLinkKey, unknown>>,
): CreatorSocialLinks {
  const links: CreatorSocialLinks = {};

  for (const key of socialLinkKeys) {
    const value = stringValue(input[key]).trim();

    if (value) {
      links[key] = value;
    }
  }

  return links;
}

export function buildAdminCreatorInsertPayload(
  input: AdminCreatorFormInput,
): AdminCreatorInsertPayload {
  return {
    owner_user_id: null,
    slug: input.slug,
    display_name: input.displayName,
    bio: input.bio,
    avatar_path: null,
    social_links: input.socialLinks,
    status: input.status,
    is_sample: input.isSample,
    onboarded_at: null,
    claimed_at: null,
    claim_token_hash: null,
    claim_expires_at: null,
    is_founding: false,
    founding_granted_at: null,
  };
}

export function buildAdminCreatorUpdatePayload(
  input: AdminCreatorFormInput,
): AdminCreatorUpdatePayload {
  return {
    slug: input.slug,
    display_name: input.displayName,
    bio: input.bio,
    social_links: input.socialLinks,
    status: input.status,
    is_sample: input.isSample,
  };
}

export function formatCreatorStatus(status: CreatorStatus) {
  return creatorStatusLabels[status] ?? status;
}

export function getCreatorPlatformLabels(
  socialLinks: CreatorSocialLinks,
  listingPlatforms: string[],
) {
  const labels = new Set<string>();

  for (const key of socialLinkKeys) {
    if (socialLinks[key]) {
      labels.add(socialLinkLabels[key]);
    }
  }

  for (const platform of listingPlatforms) {
    const normalized = platform.trim();

    if (normalized) {
      labels.add(normalized);
    }
  }

  return [...labels];
}

function isCreatorStatus(value: string): value is CreatorStatus {
  return creatorStatuses.includes(value as CreatorStatus);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function nullableStringValue(value: unknown) {
  const string = stringValue(value).trim();
  return string.length > 0 ? string : null;
}
