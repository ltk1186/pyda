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
  const isSample = shouldShowSampleBadge(listing);
  const coverImage =
    listing.imagePaths[0] ??
    "/images/samples/jeju-hanbakwi-youtube-integration.webp";
  const coverImageSrc = resolveImagePath(coverImage);

  return (
    <Link
      className={
        isSample
          ? "group block min-w-0 overflow-hidden rounded-xl border border-[var(--brand-border)] bg-white transition hover:border-[var(--brand-primary-hover)]"
          : "group block min-w-0"
      }
      href={`/listings/${listing.slug}`}
      aria-label={`${listing.title} 상세 보기`}
    >
      {isSample ? (
        <div className="brand-soft-surface flex min-h-14 flex-col items-start justify-center gap-1 border-b border-[var(--brand-border)] px-3 py-2.5 sm:min-h-12 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span className="brand-badge inline-flex rounded-full px-2.5 py-1 text-xs font-semibold">
            예시 상품
          </span>
          <span className="text-[11px] font-medium text-[var(--brand-ink)] sm:text-xs">
            실제 등록 상품 아님
          </span>
        </div>
      ) : null}

      <div
        className={`relative aspect-[4/5] overflow-hidden bg-neutral-100 ${
          isSample ? "" : "rounded-lg"
        }`}
      >
        <Image
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
          src={coverImageSrc}
          alt={`${listing.title} 대표 이미지`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          unoptimized
        />
      </div>

      {isSample ? (
        <div className="min-w-0 space-y-1.5 px-3 pb-4 pt-3">
          <p className="truncate text-xs font-semibold text-[var(--brand-ink)]">
            {listing.platform} · {listing.adFormat}
          </p>
          <p className="line-clamp-2 text-sm font-medium leading-5 text-neutral-950">
            {listing.title}
          </p>
          <p className="pt-1 text-sm text-neutral-700">
            <span className="text-neutral-500">예시 가격</span>{" "}
            <span className="font-semibold text-neutral-950">
              {formatKrw(listing.priceKrw)}
            </span>
          </p>
          <p className="truncate text-xs text-neutral-500">
            예시 크리에이터 · {listing.creator.displayName}
          </p>
        </div>
      ) : (
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
          <p className="line-clamp-2 text-sm text-neutral-900">
            {listing.title}
          </p>
          <p className="text-sm font-semibold text-neutral-950">
            {formatKrw(listing.priceKrw)}
          </p>
        </div>
      )}
    </Link>
  );
}
