import Image from "next/image";
import Link from "next/link";
import { getCreatorListings } from "@/lib/creator/listings";
import { requireOwnedCreator } from "@/lib/creator/owner";
import { formatKrw } from "@/lib/marketplace/format";
import { resolveImagePath } from "@/lib/images";
import { getListingOperationState } from "@/lib/listing-visibility";

export const dynamic = "force-dynamic";

export default async function CreatorListingsPage() {
  const creator = await requireOwnedCreator("/creator/listings");

  if (!creator) {
    return (
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">내 광고 자리</h1>
        <div className="mt-6 rounded-lg border border-neutral-200 p-6">
          <p className="text-sm text-neutral-600">
            연결된 크리에이터 프로필이 없습니다.
          </p>
        </div>
      </section>
    );
  }

  const listings = await getCreatorListings(creator.id);
  const isArchived = creator.status === "archived";

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">내 광고 자리</h1>
        {!isArchived ? (
          <Link
            className="brand-primary rounded-md border px-4 py-2 text-sm font-semibold transition"
            href="/creator/listings/new"
          >
            새 광고 자리 추가
          </Link>
        ) : null}
      </div>
      {isArchived ? (
        <p className="mt-4 rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
          현재 크리에이터 프로필은 보관 상태입니다. 관리가 필요한 경우 Pyda에
          문의해주세요.
        </p>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200">
        {listings.length > 0 ? (
          <div className="divide-y divide-neutral-200">
            {listings.map((listing) => {
              const operation = getListingOperationState({
                status: listing.status,
                visibilityPreference: listing.visibilityPreference,
              });
              return <article
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
                  <span className="mt-2 inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                    {operation.label}
                  </span>
                  <p className="mt-2 max-w-xl text-xs leading-5 text-neutral-500">
                    {operation.description}
                  </p>
                </div>
                <div className="flex self-center sm:flex-col gap-2">
                {isArchived ? (
                  <span className="self-center rounded-md border border-neutral-200 px-3 py-2 text-center text-sm text-neutral-400">
                    수정 불가
                  </span>
                ) : (
                  <Link
                    className="brand-outline self-center rounded-md border px-3 py-2 text-center text-sm font-medium transition"
                    href={`/creator/listings/${listing.id}/edit`}
                  >
                    수정
                  </Link>
                )}
                {listing.status === "published" ? (
                  <Link
                    className="brand-outline rounded-md border px-3 py-2 text-center text-sm font-medium transition"
                    href={`/listings/${listing.slug}`}
                  >
                    메인에서 보기
                  </Link>
                ) : null}
                </div>
              </article>;
            })}
          </div>
        ) : (
          <div className="p-6 text-sm text-neutral-600">
            등록된 광고 자리가 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}
