import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingGallery } from "@/components/marketplace/listing-gallery";
import { RequestCta } from "@/components/marketplace/request-cta";
import { SampleBadge } from "@/components/marketplace/sample-badge";
import { getCurrentUser } from "@/lib/auth/session";
import { shouldShowSampleBadge } from "@/lib/marketplace/badges";
import { getPublicListingBySlug } from "@/lib/marketplace/data";
import { formatAudienceSize, formatKrw } from "@/lib/marketplace/format";

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

  const user = await getCurrentUser();
  const requestIntent = getSingleParam(query.request) === "1";
  const requestPath = `/listings/${listing.slug}?request=1`;
  const ctaHref = user
    ? requestPath
    : `/login?next=${encodeURIComponent(requestPath)}`;
  const audience = formatAudienceSize(listing.audienceSize);

  return (
    <main className="min-h-screen bg-white pb-36 text-neutral-950 lg:pb-0">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="text-lg font-semibold tracking-tight" href="/">
            Pyda
          </Link>
          <Link className="text-sm text-neutral-600 hover:text-neutral-950" href="/">
            전체 상품
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <ListingGallery title={listing.title} imagePaths={listing.imagePaths} />

        <div className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            {shouldShowSampleBadge(listing) ? <SampleBadge /> : null}

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance">
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
                  {listing.creator.displayName}
                </p>
                {listing.creator.bio ? (
                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    {listing.creator.bio}
                  </p>
                ) : null}
                {listing.creator.isFounding ? (
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
                <dt className="text-neutral-500">가격</dt>
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
            <RequestCta href={ctaHref} requestIntent={requestIntent} />
          </aside>
        </div>
      </div>
    </main>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
