import Image from "next/image";
import { resolveImagePath } from "@/lib/images";

type ListingGalleryProps = {
  title: string;
  imagePaths: string[];
};

export function ListingGallery({ title, imagePaths }: ListingGalleryProps) {
  const images = imagePaths.slice(0, 3);
  const [firstImage, ...secondaryImages] = images;

  if (!firstImage) {
    return (
      <div className="aspect-[4/5] rounded-lg bg-neutral-100" aria-hidden />
    );
  }

  return (
    <>
      <div className="flex snap-x gap-3 overflow-x-auto md:hidden">
        {images.map((image, index) => (
          <div
            key={image}
            className="relative aspect-[4/5] w-[82vw] shrink-0 snap-start overflow-hidden rounded-lg bg-neutral-100"
          >
            <Image
              className="object-cover"
              src={resolveImagePath(image)}
              alt={`${title} 이미지 ${index + 1}`}
              fill
              sizes="82vw"
              unoptimized
            />
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-lg bg-neutral-100 md:grid md:aspect-[16/9] md:grid-cols-[2fr_1fr] md:gap-1">
        <div className="relative min-h-0">
          <Image
            className="object-cover"
            src={resolveImagePath(firstImage)}
            alt={`${title} 이미지 1`}
            fill
            sizes="(min-width: 768px) 66vw"
            unoptimized
          />
        </div>
        {secondaryImages.length > 0 ? (
          <div className="grid gap-1">
            {secondaryImages.map((image, index) => (
              <div className="relative min-h-0" key={image}>
                <Image
                  className="object-cover"
                  src={resolveImagePath(image)}
                  alt={`${title} 이미지 ${index + 2}`}
                  fill
                  sizes="(min-width: 768px) 33vw"
                  unoptimized
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
