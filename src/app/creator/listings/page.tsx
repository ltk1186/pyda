import Image from "next/image";
import Link from "next/link";
import { formatListingStatus } from "@/lib/admin/listing-core";
import { getCreatorListings } from "@/lib/creator/listings";
import { requireOwnedCreator } from "@/lib/creator/owner";
import { formatKrw } from "@/lib/marketplace/format";
import { resolveImagePath } from "@/lib/images";

export const dynamic = "force-dynamic";

export default async function CreatorListingsPage() {
  const creator = await requireOwnedCreator("/creator/listings");

  if (!creator) {
    return (
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">내 광고 상품</h1>
        <div className="mt-6 rounded-lg border border-neutral-200 p-6">
          <p className="text-sm text-neutral-600">
            연결된 크리에이터 프로필이 없습니다.
          </p>
        </div>
      </section>
    );
  }

  const listings = await getCreatorListings(creator.id);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">내 광고 상품</h1>
        <Link
          className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          href="/creator/listings/new"
        >
          새 광고 상품 추가
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200">
        {listings.length > 0 ? (
          <div className="divide-y divide-neutral-200">
            {listings.map((listing) => (
              <article
                className="grid gap-4 p-4 sm:grid-cols-[80px_minmax(0,1fr)_auto]"
                key={listing.id}
              >
                <div className="relative aspect-[4/5] w-20 overflow-hidden rounded-md bg-neutral-100">
                  {listing.imagePaths[0] ? (
                    <Image
                      alt={listing.title}
                      className="object-cover"
                      fill
                      src={resolveImagePath(listing.imagePaths[0])}
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold">
                    {listing.title}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    {listing.platform} · {listing.adFormat}
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {formatKrw(listing.priceKrw)}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {formatListingStatus(listing.status)}
                  </p>
                </div>
                <Link
                  className="self-center rounded-md border border-neutral-300 px-3 py-2 text-center text-sm font-medium hover:bg-neutral-50"
                  href={`/creator/listings/${listing.id}/edit`}
                >
                  수정
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-6 text-sm text-neutral-600">
            등록된 광고 상품이 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}
