import { describe, expect, it } from "vitest";
import {
  buildAdminCreatorInsertPayload,
  cleanSocialLinks,
  formatCreatorStatus,
  isValidCreatorSlug,
  validateAdminCreatorForm,
} from "./creator-core";

describe("creator slug validation", () => {
  it("allows simple lowercase URL slugs", () => {
    expect(isValidCreatorSlug("jeju-travel-01")).toBe(true);
    expect(isValidCreatorSlug("creator1")).toBe(true);
  });

  it("rejects invalid slugs", () => {
    expect(isValidCreatorSlug("")).toBe(false);
    expect(isValidCreatorSlug("Jeju")).toBe(false);
    expect(isValidCreatorSlug("-jeju")).toBe(false);
    expect(isValidCreatorSlug("jeju-")).toBe(false);
    expect(isValidCreatorSlug("jeju--travel")).toBe(false);
    expect(isValidCreatorSlug("jeju_travel")).toBe(false);
  });
});

describe("creator form helpers", () => {
  it("cleans supported social links only", () => {
    expect(
      cleanSocialLinks({
        youtube: " https://youtube.com/@pyda ",
        instagram: "",
        blog: "https://blog.naver.com/pyda",
        tiktok: null,
      }),
    ).toEqual({
      youtube: "https://youtube.com/@pyda",
      blog: "https://blog.naver.com/pyda",
    });
  });

  it("formats creator status in Korean", () => {
    expect(formatCreatorStatus("draft")).toBe("작성 중");
    expect(formatCreatorStatus("published")).toBe("공개");
    expect(formatCreatorStatus("hidden")).toBe("숨김");
    expect(formatCreatorStatus("archived")).toBe("보관");
  });

  it("builds new creator payload without client-controlled protected fields", () => {
    const result = validateAdminCreatorForm({
      displayName: "김제주",
      slug: "kim-jeju",
      bio: "제주 여행 크리에이터",
      youtube: "https://youtube.com/@jeju",
      instagram: "",
      blog: "",
      tiktok: "",
      status: "published",
      isSample: true,
      owner_user_id: "attacker",
      is_founding: true,
      claim_token_hash: "token",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const payload = buildAdminCreatorInsertPayload(result.data);

    expect(payload.owner_user_id).toBeNull();
    expect(payload.is_founding).toBe(false);
    expect(payload.founding_granted_at).toBeNull();
    expect(payload.claim_token_hash).toBeNull();
    expect(payload.claim_expires_at).toBeNull();
    expect(payload.claimed_at).toBeNull();
    expect(payload.onboarded_at).toBeNull();
  });
});
