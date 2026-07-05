import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminRequests } from "@/lib/admin/data";
import { formatAdminRequestStatus } from "@/lib/admin/request-status";
import { formatKrw } from "@/lib/marketplace/format";
import { formatRequestDate } from "@/lib/requests";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  await requireAdmin("/admin/requests");
  const requests = await getAdminRequests();

  return (
    <main>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">광고 요청</h1>
        <p className="mt-2 text-sm text-neutral-600">
          최신 요청 순으로 운영 상태를 확인합니다.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">담당자</th>
                  <th className="px-4 py-3 font-medium">브랜드</th>
                  <th className="px-4 py-3 font-medium">광고 상품</th>
                  <th className="px-4 py-3 font-medium">크리에이터</th>
                  <th className="px-4 py-3 font-medium">최종 금액</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium">요청일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {requests.map((request) => (
                  <tr className="hover:bg-neutral-50" key={request.id}>
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/admin/requests/${request.id}`}>
                        {request.contactName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{request.brandName}</td>
                    <td className="px-4 py-3">{request.listingTitle}</td>
                    <td className="px-4 py-3">{request.creatorName}</td>
                    <td className="px-4 py-3">
                      {request.quotedAmountKrw === null
                        ? "미정"
                        : formatKrw(request.quotedAmountKrw)}
                    </td>
                    <td className="px-4 py-3">
                      {formatAdminRequestStatus(request.status)}
                    </td>
                    <td className="px-4 py-3">
                      {formatRequestDate(request.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-5 text-sm text-neutral-600">
            아직 광고 요청이 없습니다.
          </p>
        )}
      </div>
    </main>
  );
}
