import Image from "next/image";
import Link from "next/link";
import { resolveImagePath } from "@/lib/images";
import { shouldShowSampleBadge } from "@/lib/marketplace/badges";
import { formatKrw } from "@/lib/marketplace/format";
import type { PublicListing } from "@/lib/marketplace/types";

type ListingCardProps = {
  listing: PublicListing;
};

export function ListingCard({ listing }: ListingCardProps) {
  const coverImage = listing.imagePaths[0] ?? "/images/samples/jeju-youtube-1.svg";
  const coverImageSrc = resolveImagePath(coverImage);

  return (
    <Link
      className="group block min-w-0"
      href={`/listings/${listing.slug}`}
      aria-label={`${listing.title} 상세 보기`}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-neutral-100">
        <Image
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
          src={coverImageSrc}
          alt={`${listing.title} 대표 이미지`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          unoptimized
        />
        {shouldShowSampleBadge(listing) ? (
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[11px] font-medium text-neutral-800 ring-1 ring-neutral-200">
            예시 광고 상품
          </span>
        ) : null}
      </div>

      <div className="mt-3 min-w-0 space-y-1.5">
        <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-neutral-950">
          <span className="truncate">{listing.creator.displayName}</span>
          {listing.creator.isFounding ? (
            <span className="shrink-0 text-xs text-neutral-500">
              Founding Creator
            </span>
          ) : null}
        </div>
        <p className="truncate text-sm text-neutral-600">
          {listing.platform} · {listing.adFormat}
        </p>
        <p className="line-clamp-2 text-sm text-neutral-900">{listing.title}</p>
        <p className="text-sm font-semibold text-neutral-950">
          {formatKrw(listing.priceKrw)}
        </p>
      </div>
    </Link>
  );
}
