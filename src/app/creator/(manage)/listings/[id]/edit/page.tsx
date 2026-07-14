import Link from "next/link";
import { notFound } from "next/navigation";
import { CreatorListingForm } from "@/components/creator/listing-form";
import { getCreatorListingById } from "@/lib/creator/listings";
import { requireOwnedCreator } from "@/lib/creator/owner";
import { updateCreatorListing } from "../../actions";

type EditCreatorListingPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function EditCreatorListingPage({
  params,
}: EditCreatorListingPageProps) {
  const { id } = await params;
  const creator = await requireOwnedCreator(`/creator/listings/${id}/edit`);

  if (!creator) {
    return (
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">광고 자리 수정</h1>
        <div className="mt-6 rounded-lg border border-neutral-200 p-6">
          <p className="text-sm text-neutral-600">
            연결된 크리에이터 프로필이 없습니다.
          </p>
        </div>
      </section>
    );
  }

  if (creator.status === "archived") {
    return (
      <section>
        <Link
          className="text-sm text-neutral-600 hover:text-neutral-950"
          href="/creator/listings"
        >
          내 광고 자리
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          광고 자리 수정
        </h1>
        <div className="mt-6 rounded-lg border border-neutral-200 p-6">
          <p className="text-sm text-neutral-600">
            현재 크리에이터 프로필은 보관 상태입니다. 관리가 필요한 경우
            Pyda에 문의해주세요.
          </p>
        </div>
      </section>
    );
  }

  const listing = await getCreatorListingById({
    creatorId: creator.id,
    listingId: id,
  });

  if (!listing) {
    notFound();
  }

  return (
    <section>
      <Link
        className="text-sm text-neutral-600 hover:text-neutral-950"
        href="/creator/listings"
      >
        내 광고 자리
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        광고 자리 수정
      </h1>
      <div className="mt-6">
        <CreatorListingForm
          action={updateCreatorListing.bind(null, listing.id)}
          listing={listing}
          submitLabel="광고 자리 저장"
        />
      </div>
    </section>
  );
}
