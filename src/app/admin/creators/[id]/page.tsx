import Link from "next/link";
import { notFound } from "next/navigation";
import { updateAdminCreator } from "@/app/admin/creators/actions";
import { AdminCreatorForm } from "@/components/admin/creator-form";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminCreatorById } from "@/lib/admin/creators";
import { formatCreatorStatus } from "@/lib/admin/creator-core";
import { formatRequestDate } from "@/lib/requests";

type AdminCreatorDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminCreatorDetailPage({
  params,
}: AdminCreatorDetailPageProps) {
  const { id } = await params;
  await requireAdmin(`/admin/creators/${id}`);
  const creator = await getAdminCreatorById(id);

  if (!creator) {
    notFound();
  }

  return (
    <main>
      <Link
        className="text-sm text-neutral-600 hover:text-neutral-950"
        href="/admin/creators"
      >
        크리에이터 목록
      </Link>

      <div className="mt-4 border-b border-neutral-200 pb-5">
        <p className="text-sm font-medium text-neutral-600">
          {formatCreatorStatus(creator.status)}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {creator.displayName}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">/{creator.slug}</p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <AdminCreatorForm
            action={updateAdminCreator.bind(null, creator.id)}
            creator={creator}
            submitLabel="저장"
          />
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="text-base font-semibold">읽기 전용 상태</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <InfoItem
                label="계정 연결"
                value={creator.isClaimed ? "연결됨" : "미연결"}
              />
              <InfoItem
                label="Founding Creator"
                value={creator.isFounding ? "예" : "아니오"}
              />
              <InfoItem label="광고 상품 수" value={`${creator.listingCount}`} />
              <InfoItem
                label="생성일"
                value={formatRequestDate(creator.createdAt)}
              />
            </dl>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="text-base font-semibold">이번 단계 제외</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              계정 연결, claim link, Founding Creator 확정은 이후 단계에서
              별도로 구현합니다.
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
