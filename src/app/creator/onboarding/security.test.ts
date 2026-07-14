import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("creator onboarding authentication boundary", () => {
  it("checks the current user before image, storage, or database work", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/creator/onboarding/actions.ts"),
      "utf8",
    );
    const authIndex = source.indexOf("await getCurrentUser()");

    expect(authIndex).toBeGreaterThan(-1);
    expect(authIndex).toBeLessThan(source.indexOf("getCoverImageFile(formData)"));
    expect(authIndex).toBeLessThan(source.indexOf("await uploadListingImages({"));
    expect(authIndex).toBeLessThan(
      source.indexOf("const supabase = createAdminClient()"),
    );
    expect(source).not.toContain('formData.get("userId")');
    expect(source).not.toContain('formData.get("creatorId")');
    expect(source).toContain('adSlot: formData.get("adSlot")');
  });

  it("clears the browser draft only from the successful complete page", () => {
    const formSource = readFileSync(
      join(process.cwd(), "src/components/creator/onboarding-form.tsx"),
      "utf8",
    );
    const completeSource = readFileSync(
      join(process.cwd(), "src/app/creator/onboarding/complete/page.tsx"),
      "utf8",
    );

    expect(formSource).not.toContain("clearCreatorOnboardingDraft");
    expect(formSource).toContain("카카오로 연결하고 등록 확인하기");
    expect(formSource).toContain("<SubmitButton />");
    expect(formSource).toContain("if (!isAuthenticated)");
    expect(formSource).toContain("event.preventDefault()");
    expect(completeSource).toContain("CreatorOnboardingDraftCleanup");
    expect(completeSource).toContain("첫 광고 자리 등록을 받았습니다.");
    expect(completeSource).toContain("첫 광고 자리 공개를 신청했습니다.");
    expect(completeSource).toContain("보통 1영업일 안에 확인합니다.");
  });
});
