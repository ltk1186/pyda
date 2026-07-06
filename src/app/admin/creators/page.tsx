import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminCreators } from "@/lib/admin/creators";
import { formatCreatorStatus } from "@/lib/admin/creator-core";

export const dynamic = "force-dynamic";

export default async function AdminCreatorsPage() {
  await requireAdmin("/admin/creators");
  const creators = await getAdminCreators();

  return (
    <main>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">크리에이터</h1>
          <p className="mt-2 text-sm text-neutral-600">
            관리자가 직접 생성한 크리에이터 프로필을 관리합니다.
          </p>
        </div>
        <Link
          className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          href="/admin/creators/new"
        >
          크리에이터 추가
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {creators.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">아바타</th>
                  <th className="px-4 py-3 font-medium">이름</th>
                  <th className="px-4 py-3 font-medium">사용 플랫폼</th>
                  <th className="px-4 py-3 font-medium">광고 상품 수</th>
                  <th className="px-4 py-3 font-medium">공개 상태</th>
                  <th className="px-4 py-3 font-medium">Founding Creator</th>
                  <th className="px-4 py-3 font-medium">계정 연결</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {creators.map((creator) => (
                  <tr className="hover:bg-neutral-50" key={creator.id}>
                    <td className="px-4 py-3">
                      {creator.avatarPath ? (
                        <Image
                          alt={`${creator.displayName} 아바타`}
                          className="h-10 w-10 rounded-full bg-neutral-100 object-cover"
                          height={40}
                          src={creator.avatarPath}
                          unoptimized
                          width={40}
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-500">
                          없음
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/admin/creators/${creator.id}`}>
                        {creator.displayName}
                      </Link>
                      <p className="mt-1 text-xs text-neutral-500">
                        /{creator.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {creator.platformLabels.length > 0
                        ? creator.platformLabels.join(", ")
                        : "없음"}
                    </td>
                    <td className="px-4 py-3">{creator.listingCount}</td>
                    <td className="px-4 py-3">
                      {formatCreatorStatus(creator.status)}
                    </td>
                    <td className="px-4 py-3">
                      {creator.isFounding ? "예" : "아니오"}
                    </td>
                    <td className="px-4 py-3">
                      {creator.isClaimed ? "연결됨" : "미연결"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-5 text-sm text-neutral-600">
            아직 등록된 크리에이터가 없습니다.
          </p>
        )}
      </div>
    </main>
  );
}
