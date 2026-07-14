import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ListingGallery } from "@/components/marketplace/listing-gallery";
import {
  RequestCta,
  SampleRequestCta,
} from "@/components/marketplace/request-cta";
import { SampleBadge } from "@/components/marketplace/sample-badge";
import {
  getPublicHeaderProfileForUser,
  PublicHeader,
} from "@/components/navigation/public-header";
import { RequestForm } from "@/components/requests/request-form";
import { getCurrentUser } from "@/lib/auth/session";
import { shouldShowSampleBadge } from "@/lib/marketplace/badges";
import { getPublicListingBySlug } from "@/lib/marketplace/data";
import { formatAudienceSize, formatKrw } from "@/lib/marketplace/format";
import { createAdvertisementRequest } from "./actions";

type ListingDetailProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    request?: string | string[];
  }>;
};

export default async function ListingDetail({
  params,
  searchParams,
}: ListingDetailProps) {
  const { slug } = await params;
  const query = await searchParams;
  const listing = await getPublicListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  const isSample = shouldShowSampleBadge(listing);
  const user = await getCurrentUser();
  const requestIntent = getSingleParam(query.request) === "1" && !isSample;
  const requestPath = `/listings/${listing.slug}?request=1`;

  if (requestIntent && !user) {
    redirect(`/login?next=${encodeURIComponent(requestPath)}`);
  }

  const showRequestForm = requestIntent && Boolean(user);
  const headerProfile = user
    ? await getPublicHeaderProfileForUser(user.id)
    : null;
  const ctaHref = user
    ? requestPath
    : `/login?next=${encodeURIComponent(requestPath)}`;
  const audience = formatAudienceSize(listing.audienceSize);
  const requestAction = createAdvertisementRequest.bind(null, listing.slug);

  return (
    <main
      className={`brand-page min-h-screen text-neutral-950 ${
        showRequestForm
          ? "pb-10"
          : isSample
            ? "pb-52 lg:pb-0"
            : "pb-36 lg:pb-0"
      }`}
    >
      <PublicHeader
        currentPath={`/listings/${listing.slug}`}
        profile={headerProfile}
      />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {isSample ? (
          <section className="brand-soft-surface mb-4 flex flex-col gap-2 rounded-xl border border-[var(--brand-border)] px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
            <SampleBadge />
            <div className="text-sm leading-6">
              <p className="font-semibold text-[var(--brand-ink)]">
                실제 등록 상품이 아닙니다.
              </p>
              <p className="text-neutral-600">
                콘텐츠 속 광고 자리가 어떻게 거래되는지 보여드리는
                예시입니다.
              </p>
            </div>
          </section>
        ) : null}

        <ListingGallery title={listing.title} imagePaths={listing.imagePaths} />

        <div className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">
              {listing.title}
            </h1>

            <div className="mt-6 flex items-start gap-3 border-y border-neutral-200 py-5">
              {listing.creator.avatarPath ? (
                <Image
                  className="h-12 w-12 rounded-full bg-neutral-100 object-cover"
                  src={listing.creator.avatarPath}
                  alt={`${listing.creator.displayName} 프로필 이미지`}
                  width={48}
                  height={48}
                  unoptimized
                />
              ) : null}
              <div>
                <p className="font-medium text-neutral-950">
                  {isSample ? "예시 크리에이터 · " : ""}
                  {listing.creator.displayName}
                </p>
                {listing.creator.bio ? (
                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    {listing.creator.bio}
                  </p>
                ) : null}
                {!isSample && listing.creator.isFounding ? (
                  <p className="mt-2 text-xs font-medium text-neutral-600">
                    Founding Creator
                  </p>
                ) : null}
              </div>
            </div>

            <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-neutral-500">플랫폼과 채널</dt>
                <dd className="mt-1 font-medium text-neutral-950">
                  {listing.platform}
                  {listing.channelName ? ` · ${listing.channelName}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">광고 형식</dt>
                <dd className="mt-1 font-medium text-neutral-950">
                  {listing.adFormat}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">
                  {isSample ? "예시 가격" : "가격"}
                </dt>
                <dd className="mt-1 font-medium text-neutral-950">
                  {formatKrw(listing.priceKrw)}
                </dd>
              </div>
              {audience ? (
                <div>
                  <dt className="text-neutral-500">채널 규모</dt>
                  <dd className="mt-1 font-medium text-neutral-950">
                    {audience}
                  </dd>
                </div>
              ) : null}
            </dl>

            <section className="mt-9">
              <h2 className="text-lg font-semibold">제공되는 내용</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
                {listing.deliverables.map((deliverable) => (
                  <li key={deliverable}>- {deliverable}</li>
                ))}
              </ul>
            </section>

            <section className="mt-9">
              <h2 className="text-lg font-semibold">상세 설명</h2>
              <p className="mt-3 text-sm leading-7 text-neutral-700">
                {listing.description}
              </p>
            </section>
          </section>

          <aside>
            {isSample ? (
              <SampleRequestCta
                href={`/advertise?example=${encodeURIComponent(listing.slug)}`}
              />
            ) : showRequestForm ? (
              <div className="lg:sticky lg:top-6">
                <RequestForm action={requestAction} />
              </div>
            ) : (
              <RequestCta href={ctaHref} requestIntent={false} />
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
