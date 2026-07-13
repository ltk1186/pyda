import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getPublicHeaderProfileForUser,
  PublicHeader,
} from "@/components/navigation/public-header";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdvertiserRequests } from "@/lib/requests/data";
import { formatRequestDate, formatRequestStatus } from "@/lib/requests";

export const dynamic = "force-dynamic";

export default async function AccountRequestsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/account/requests")}`);
  }

  const requests = await getAdvertiserRequests(user.id);
  const headerProfile = await getPublicHeaderProfileForUser(user.id);

  return (
    <main className="brand-page min-h-screen text-neutral-950">
      <PublicHeader currentPath="/account/requests" profile={headerProfile} />

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">내 광고 요청</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            제출한 광고 요청의 현재 상태를 확인할 수 있습니다.
          </p>
        </div>

        {requests.length > 0 ? (
          <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
            {requests.map((request) => (
              <Link
                className="block py-5 hover:bg-neutral-50"
                href={`/account/requests/${request.id}`}
                key={request.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-neutral-950">
                      {request.listingTitle}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {request.brandName}
                    </p>
                  </div>
                  <div className="text-sm text-neutral-600 sm:text-right">
                    <p className="font-medium text-neutral-950">
                      {formatRequestStatus(request.status)}
                    </p>
                    <p className="mt-1">{formatRequestDate(request.createdAt)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-neutral-200 p-6">
            <p className="text-sm text-neutral-600">
              아직 제출한 광고 요청이 없습니다.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
