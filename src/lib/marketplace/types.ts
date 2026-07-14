export const PLATFORM_FILTERS = [
  "전체",
  "YouTube",
  "Instagram",
  "네이버 블로그",
  "TikTok",
] as const;

export type PlatformFilter = (typeof PLATFORM_FILTERS)[number];

export type PublicCreator = {
  id: string;
  slug: string;
  displayName: string;
  bio: string | null;
  avatarPath: string | null;
  socialLinks: Record<string, string>;
  status: "published";
  isSample: boolean;
  isFounding: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublicListing = {
  id: string;
  slug: string;
  title: string;
  platform: Exclude<PlatformFilter, "전체">;
  channelName: string | null;
  channelUrl: string | null;
  audienceSize: number | null;
  adFormat: string;
  description: string | null;
  deliverables: string[];
  priceKrw: number;
  imagePaths: string[];
  status: "published";
  isSample: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  creator: PublicCreator;
};

export type ListingRow = {
  id: string;
  slug: string;
  title: string;
  platform: string;
  channel_name: string | null;
  channel_url: string | null;
  audience_size: number | null;
  ad_format: string;
  description: string | null;
  deliverables: string[] | null;
  price_krw: number;
  image_paths: string[] | null;
  status: string;
  visibility_preference: string;
  is_sample: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  creators: CreatorRow | CreatorRow[] | null;
};

export type CreatorRow = {
  id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  avatar_path: string | null;
  social_links: Record<string, string> | null;
  status: string;
  is_sample: boolean;
  is_founding: boolean;
  created_at: string;
  updated_at: string;
};
