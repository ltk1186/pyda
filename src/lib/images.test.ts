import { afterEach, describe, expect, it } from "vitest";
import { publicMediaBucket, resolveImagePath } from "./images";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
});

describe("resolveImagePath", () => {
  it("keeps local sample image paths unchanged", () => {
    expect(resolveImagePath("/images/samples/example.svg")).toBe(
      "/images/samples/example.svg",
    );
  });

  it("resolves storage object paths to public bucket URLs", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable";
    expect(resolveImagePath("creators/a/listings/b/image.webp")).toBe(
      `https://project.supabase.co/storage/v1/object/public/${publicMediaBucket}/creators/a/listings/b/image.webp`,
    );
  });
});
