import Link from "next/link";
import { notFound } from "next/navigation";
import {
  updateAdminRequestNotes,
  updateAdminRequestStatus,
} from "@/app/admin/requests/actions";
import {
  AdminNotesForm,
  AdminStatusForm,
} from "@/components/admin/admin-request-forms";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminRequestById } from "@/lib/admin/data";
import {
  formatAdminRequestStatus,
  getAllowedAdminRequestTransitions,
} from "@/lib/admin/request-status";
import { formatKrw } from "@/lib/marketplace/format";
import { formatPreferredSchedule, formatRequestDate } from "@/lib/requests";

type AdminRequestDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminRequestDetailPage({
  params,
}: AdminRequestDetailPageProps) {
  const { id } = await params;
  await requireAdmin(`/admin/requests/${id}`);
  const request = await getAdminRequestById(id);

  if (!request) {
    notFound();
  }

  const allowedTransitions = getAllowedAdminRequestTransitions(request.status);
  const notesAction = updateAdminRequestNotes.bind(null, request.id);

  return (
    <main>
      <Link
        className="text-sm text-neutral-600 hover:text-neutral-950"
        href="/admin/requests"
      >
        광고 요청 목록
      </Link>

      <div className="mt-4 flex flex-col gap-3 border-b border-neutral-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600">
            {formatAdminRequestStatus(request.status)}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {request.brandName}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            요청일 {formatRequestDate(request.createdAt)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm">
          <p className="text-neutral-500">최종 금액</p>
          <p className="mt-1 font-semibold text-neutral-950">
            {request.quotedAmountKrw === null
              ? "미정"
              : formatKrw(request.quotedAmountKrw)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="text-base font-semibold">요청 정보</h2>
            <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
              <InfoItem label="담당자명" value={request.contactName} />
              <InfoItem label="브랜드명" value={request.brandName} />
              <InfoItem label="선호 연락 방식" value={request.contactChannel} />
              <InfoItem label="연락처" value={request.contactValue} />
              <InfoItem label="광고 상품" value={request.listingTitle} />
              <InfoItem label="크리에이터" value={request.creatorName} />
              <InfoItem
                label="희망 일정"
                value={formatPreferredSchedule(
                  request.preferredStartDate,
                  request.preferredEndDate,
                )}
              />
              <InfoItem
                label="현재 상태"
                value={formatAdminRequestStatus(request.status)}
              />
            </dl>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="text-base font-semibold">요청 내용</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-neutral-700">
              {request.campaignBrief}
            </p>
          </div>
        </section>

        <aside className="space-y-4">
          <AdminNotesForm
            action={notesAction}
            defaultValue={request.adminNotes ?? ""}
          />

          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="text-base font-semibold">상태 변경</h2>
            {allowedTransitions.length > 0 ? (
              <div className="mt-4 space-y-3">
                {allowedTransitions.map((nextStatus) => (
                  <AdminStatusForm
                    action={updateAdminRequestStatus.bind(
                      null,
                      request.id,
                      nextStatus,
                    )}
                    key={nextStatus}
                    nextStatus={nextStatus}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-neutral-600">
                현재 상태에서는 관리자 수동 변경을 제공하지 않습니다.
              </p>
            )}
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
