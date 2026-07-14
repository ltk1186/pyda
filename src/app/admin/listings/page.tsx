import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getAdminListings,
  type AdminListingSampleFilter,
} from "@/lib/admin/listings";
import { resolveImagePath } from "@/lib/images";
import { formatKrw } from "@/lib/marketplace/format";
import { getListingOperationState } from "@/lib/listing-visibility";

type AdminListingsPageProps = {
  searchParams: Promise<{
    sample?: string | string[];
  }>;
};

const filters: Array<{
  label: string;
  value: AdminListingSampleFilter;
}> = [
  { label: "전체", value: "all" },
  { label: "실제 상품", value: "real" },
  { label: "예시 상품", value: "sample" },
];

export const dynamic = "force-dynamic";

export default async function AdminListingsPage({
  searchParams,
}: AdminListingsPageProps) {
  await requireAdmin("/admin/listings");
  const query = await searchParams;
  const filter = parseSampleFilter(getSingleParam(query.sample));
  const listings = await getAdminListings(filter);

  return (
    <main>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">광고 상품</h1>
          <p className="mt-2 text-sm text-neutral-600">
            크리에이터의 광고 상품과 공개 상태를 관리합니다.
          </p>
        </div>
        <Link
          className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          href="/admin/listings/new"
        >
          광고 상품 추가
        </Link>
      </div>

      <div className="mt-6 flex gap-2 text-sm">
        {filters.map((item) => (
          <Link
            className={`rounded-full border px-3 py-1.5 ${
              item.value === filter
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-700"
            }`}
            href={item.value === "all" ? "/admin/listings" : `/admin/listings?sample=${item.value}`}
            key={item.value}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {listings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">대표 이미지</th>
                  <th className="px-4 py-3 font-medium">상품명</th>
                  <th className="px-4 py-3 font-medium">크리에이터</th>
                  <th className="px-4 py-3 font-medium">플랫폼</th>
                  <th className="px-4 py-3 font-medium">광고 형식</th>
                  <th className="px-4 py-3 font-medium">가격</th>
                  <th className="px-4 py-3 font-medium">운영 방식</th>
                  <th className="px-4 py-3 font-medium">예시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {listings.map((listing) => (
                  <tr className="hover:bg-neutral-50" key={listing.id}>
                    <td className="px-4 py-3">
                      {listing.imagePaths[0] ? (
                        <div className="relative h-14 w-12 overflow-hidden rounded bg-neutral-100">
                          <Image
                            alt={`${listing.title} 대표 이미지`}
                            className="object-cover"
                            fill
                            src={resolveImagePath(listing.imagePaths[0])}
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex h-14 w-12 items-center justify-center rounded bg-neutral-100 text-xs text-neutral-500">
                          없음
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/admin/listings/${listing.id}`}>
                        {listing.title}
                      </Link>
                      <p className="mt-1 text-xs text-neutral-500">
                        /{listing.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3">{listing.creatorName}</td>
                    <td className="px-4 py-3">{listing.platform}</td>
                    <td className="px-4 py-3">{listing.adFormat}</td>
                    <td className="px-4 py-3">{formatKrw(listing.priceKrw)}</td>
                    <td className="px-4 py-3">
                      {getListingOperationState({
                        status: listing.status,
                        visibilityPreference: listing.visibilityPreference,
                      }).label}
                    </td>
                    <td className="px-4 py-3">
                      {listing.isSample ? "예" : "아니오"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-5 text-sm text-neutral-600">
            조건에 맞는 광고 상품이 없습니다.
          </p>
        )}
      </div>
    </main>
  );
}

function parseSampleFilter(value: string | undefined): AdminListingSampleFilter {
  return value === "real" || value === "sample" ? value : "all";
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
