import { requireAdmin } from "@/lib/admin/auth";
import { getAdminDashboardStats } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin("/admin");
  const stats = await getAdminDashboardStats();

  const cards = [
    { label: "공개 크리에이터", value: stats.publishedCreators },
    { label: "공개 광고 상품", value: stats.publishedListings },
    { label: "신규 요청", value: stats.submittedRequests },
    { label: "완료 거래", value: stats.completedRequests },
  ];

  return (
    <main>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">대시보드</h1>
        <p className="mt-2 text-sm text-neutral-600">
          현재 운영에 필요한 실제 데이터만 표시합니다.
        </p>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            className="rounded-lg border border-neutral-200 bg-white p-5"
            key={card.label}
          >
            <p className="text-sm text-neutral-600">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-base font-semibold">GMV 및 플랫폼 수익</h2>
        <p className="mt-2 text-sm text-neutral-600">결제 연동 후 표시</p>
      </section>
    </main>
  );
}
