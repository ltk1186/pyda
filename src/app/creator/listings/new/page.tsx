import Link from "next/link";
import { CreatorListingForm } from "@/components/creator/listing-form";
import { requireOwnedCreator } from "@/lib/creator/owner";
import { createCreatorListing } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewCreatorListingPage() {
  const creator = await requireOwnedCreator("/creator/listings/new");

  return (
    <section>
      <Link
        className="text-sm text-neutral-600 hover:text-neutral-950"
        href="/creator/listings"
      >
        내 광고 상품
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        새 광고 상품
      </h1>
      {creator ? (
        creator.status === "archived" ? (
          <ArchivedNotice />
        ) : (
          <div className="mt-6">
            <CreatorListingForm
              action={createCreatorListing}
              submitLabel="광고 상품 생성"
            />
          </div>
        )
      ) : (
        <div className="mt-6 rounded-lg border border-neutral-200 p-6">
          <p className="text-sm text-neutral-600">
            연결된 크리에이터 프로필이 없습니다.
          </p>
        </div>
      )}
    </section>
  );
}

function ArchivedNotice() {
  return (
    <div className="mt-6 rounded-lg border border-neutral-200 p-6">
      <p className="text-sm text-neutral-600">
        현재 크리에이터 프로필은 보관 상태입니다. 관리가 필요한 경우 Pyda에
        문의해주세요.
      </p>
    </div>
  );
}
