import Link from "next/link";
import { notFound } from "next/navigation";
import { updateAdminListing } from "@/app/admin/listings/actions";
import { AdminListingForm } from "@/components/admin/listing-form";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getAdminListingById,
  getAdminListingCreatorOptions,
} from "@/lib/admin/listings";
import { formatKrw } from "@/lib/marketplace/format";
import { formatRequestDate } from "@/lib/requests";
import { getListingOperationState } from "@/lib/listing-visibility";

type AdminListingDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminListingDetailPage({
  params,
}: AdminListingDetailPageProps) {
  const { id } = await params;
  await requireAdmin(`/admin/listings/${id}`);
  const [listing, creators] = await Promise.all([
    getAdminListingById(id),
    getAdminListingCreatorOptions(),
  ]);

  if (!listing) {
    notFound();
  }
  const operation = getListingOperationState({
    status: listing.status,
    visibilityPreference: listing.visibilityPreference,
  });

  return (
    <main>
      <Link
        className="text-sm text-neutral-600 hover:text-neutral-950"
        href="/admin/listings"
      >
        광고 상품 목록
      </Link>

      <div className="mt-4 border-b border-neutral-200 pb-5">
        <p className="text-sm font-medium text-neutral-600">
          {operation.label}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {listing.title}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">/{listing.slug}</p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <AdminListingForm
            action={updateAdminListing.bind(null, listing.id)}
            creators={creators}
            listing={listing}
            submitLabel="저장"
          />
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="text-base font-semibold">읽기 전용 상태</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <InfoItem label="크리에이터" value={listing.creatorName} />
              <InfoItem label="운영 방식" value={operation.label} />
              <InfoItem label="상태 설명" value={operation.description} />
              <InfoItem
                label="최초 공개일"
                value={
                  listing.publishedAt
                    ? formatRequestDate(listing.publishedAt)
                    : "아직 공개 전"
                }
              />
            </dl>
          </section>

          {listing.inventoryType ? (
            <section className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="text-base font-semibold">온보딩 신청 정보</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <InfoItem
                  label="광고 유형"
                  value={
                    listing.inventoryType === "new_content"
                      ? "새 콘텐츠에 광고 넣기"
                      : "기존 콘텐츠에 광고 붙이기"
                  }
                />
                <InfoItem
                  label="광고 자리값"
                  value={
                    listing.placementFeeKrw === null
                      ? "-"
                      : formatKrw(listing.placementFeeKrw)
                  }
                />
                <InfoItem
                  label="제작비"
                  value={
                    listing.productionFeeKrw === null
                      ? "-"
                      : formatKrw(listing.productionFeeKrw)
                  }
                />
                {listing.turnaroundDays ? (
                  <InfoItem
                    label="제작 가능 기간"
                    value={`${listing.turnaroundDays}일 이내`}
                  />
                ) : null}
                {listing.sourceContentUrl ? (
                  <InfoItem
                    label="기존 콘텐츠 URL"
                    value={listing.sourceContentUrl}
                  />
                ) : null}
                {listing.recent30dViews !== null ? (
                  <InfoItem
                    label="최근 30일 조회수 또는 도달수"
                    value={new Intl.NumberFormat("ko-KR").format(
                      listing.recent30dViews,
                    )}
                  />
                ) : null}
                {listing.maintenanceDays ? (
                  <InfoItem
                    label="광고 유지 기간"
                    value={`${listing.maintenanceDays}일`}
                  />
                ) : null}
                {listing.mentionSeconds ? (
                  <InfoItem
                    label="직접 소개 시간"
                    value={`${listing.mentionSeconds}초`}
                  />
                ) : null}
                {listing.storyCount ? (
                  <InfoItem
                    label="추가 스토리"
                    value={`${listing.storyCount}건`}
                  />
                ) : null}
                <InfoItem
                  label="선택 옵션"
                  value={
                    listing.optionKeys.length > 0
                      ? listing.optionKeys.join(", ")
                      : "없음"
                  }
                />
              </dl>
            </section>
          ) : null}

          <section className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="text-base font-semibold">이번 단계 제외</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              생성 후 크리에이터 변경, creator 자기 관리, 결제, 알림은 이후
              단계에서 구현합니다.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-neutral-500">{label}</dt>
      <dd className="mt-1 font-medium text-neutral-950">{value}</dd>
    </div>
  );
}
