import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationPath =
  "supabase/migrations/20260714101914_listing_visibility_and_generated_slug_repair.sql";

describe("listing visibility integration", () => {
  it("repairs only recognized generated trailing-hyphen slugs", () => {
    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain("where slug ~ '^creator-[a-z0-9-]+-$'");
    expect(migration).toContain(
      "where slug ~ '^(youtube|instagram)-(new-content|existing-traffic)-[a-z0-9-]+-$'",
    );
    expect(migration).not.toContain("where slug like '%-'");
  });

  it("keeps public access and creator inserts behind database checks", () => {
    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain("visibility_preference = 'public_review'");
    expect(migration).toContain("and status = 'draft'");
    expect(migration).toContain("new.status = 'published'");
  });

  it("does not expose or accept slug in the creator profile form", () => {
    const form = readFileSync("src/components/creator/profile-form.tsx", "utf8");
    const action = readFileSync(
      "src/app/creator/(manage)/profile/actions.ts",
      "utf8",
    );

    expect(form).not.toContain('name="slug"');
    expect(action).not.toContain('formData.get("slug")');
    expect(action).not.toContain("parsed.data.slug");
  });

  it("does not expose or accept slug in the creator listing form", () => {
    const form = readFileSync("src/components/creator/listing-form.tsx", "utf8");
    const action = readFileSync(
      "src/app/creator/(manage)/listings/actions.ts",
      "utf8",
    );

    expect(form).not.toContain('name="slug"');
    expect(action).not.toContain('formData.get("slug")');
  });

  it("requires a public review preference in the admin publish action", () => {
    const action = readFileSync("src/app/admin/listings/actions.ts", "utf8");

    expect(action).toContain("canAdminPublishListing");
    expect(action).toContain(
      "크리에이터가 메인 공개를 신청하지 않은 광고 자리입니다.",
    );
  });
});
