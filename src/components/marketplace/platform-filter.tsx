import Link from "next/link";
import { PLATFORM_FILTERS, type PlatformFilter } from "@/lib/marketplace/types";
import { cn } from "@/lib/utils";

type PlatformFilterProps = {
  activePlatform: PlatformFilter;
};

export function PlatformFilter({ activePlatform }: PlatformFilterProps) {
  return (
    <nav aria-label="플랫폼 필터" className="flex gap-2 overflow-x-auto pb-1">
      {PLATFORM_FILTERS.map((platform) => {
        const isActive = platform === activePlatform;
        const href =
          platform === "전체"
            ? "/"
            : `/?platform=${encodeURIComponent(platform)}`;

        return (
          <Link
            key={platform}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition",
              isActive
                ? "brand-selected"
                : "brand-outline",
            )}
            href={href}
            aria-current={isActive ? "page" : undefined}
          >
            {platform}
          </Link>
        );
      })}
    </nav>
  );
}
