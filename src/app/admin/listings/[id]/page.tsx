import Link from "next/link";
import { notFound } from "next/navigation";
import { updateAdminListing } from "@/app/admin/listings/actions";
import { AdminListingForm } from "@/components/admin/listing-form";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getAdminListingById,
  getAdminListingCreatorOptions,
} from "@/lib/admin/listings";
import { formatListingStatus } from "@/lib/admin/listing-core";
import { formatRequestDate } from "@/lib/requests";

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
          {formatListingStatus(listing.status)}
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
