import Link from "next/link";
import { createAdminListing } from "@/app/admin/listings/actions";
import { AdminListingForm } from "@/components/admin/listing-form";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminListingCreatorOptions } from "@/lib/admin/listings";

export const dynamic = "force-dynamic";

export default async function AdminNewListingPage() {
  await requireAdmin("/admin/listings/new");
  const creators = await getAdminListingCreatorOptions();

  return (
    <main>
      <Link
        className="text-sm text-neutral-600 hover:text-neutral-950"
        href="/admin/listings"
      >
        광고 상품 목록
      </Link>
      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">광고 상품 추가</h1>
        <p className="mt-2 text-sm text-neutral-600">
          공개 상태로 저장하려면 이미지가 최소 1장 필요합니다.
        </p>
      </div>
      <div className="mt-6 max-w-4xl">
        <AdminListingForm
          action={createAdminListing}
          creators={creators}
          submitLabel="생성"
        />
      </div>
    </main>
  );
}
