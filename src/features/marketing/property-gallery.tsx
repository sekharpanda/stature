"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Building2, ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type GalleryImage = {
  id: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
};

export function PropertyGallery({
  images,
  title,
}: {
  images: GalleryImage[];
  title: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const cover = images[0];
  const thumbs = images.slice(1, 5);
  const extra = Math.max(0, images.length - 5);
  const isOpen = active != null && images[active] != null;

  function open(index: number) {
    if (!images[index]) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    setActive(index);
  }

  const shift = useCallback(
    (delta: number) => {
      setActive((current) =>
        current == null || images.length === 0
          ? current
          : (current + delta + images.length) % images.length,
      );
    },
    [images.length],
  );

  const close = useCallback(() => {
    setActive(null);
    openerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "ArrowLeft") shift(-1);
      if (event.key === "ArrowRight") shift(1);
    };

    document.addEventListener("keydown", onKeyDown);
    // Prevent the page behind the lightbox from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close, shift]);

  return (
    <>
      <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.04]">
        <button
          type="button"
          onClick={() => open(0)}
          aria-label={`Open gallery — ${images.length} photo${images.length === 1 ? "" : "s"}`}
          className="relative block w-full overflow-hidden bg-[#eef1f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
        >
          {cover?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover.url}
              alt={cover.alt ?? title}
              className="aspect-[16/10] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center">
              <Building2 className="size-12 text-neutral-400" />
            </div>
          )}
        </button>

        {thumbs.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 p-2 sm:gap-3 sm:p-3">
            {thumbs.map((image, index) => {
              const isLast = index === thumbs.length - 1 && extra > 0;
              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => open(index + 1)}
                  aria-label={
                    isLast
                      ? `View all ${images.length} photos`
                      : `Open image ${index + 2} of ${images.length}`
                  }
                  className="relative overflow-hidden rounded-[14px] bg-[#eef1f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt=""
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                  {isLast ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                      +{extra} more
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Property gallery, image ${active! + 1} of ${images.length}`}
          onClick={close}
        >
          <button
            ref={closeButtonRef}
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={close}
            aria-label="Close gallery"
          >
            <X className="size-5" />
          </button>
          {images.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:left-6"
                onClick={(e) => {
                  e.stopPropagation();
                  shift(-1);
                }}
                aria-label="Previous image"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:right-6"
                onClick={(e) => {
                  e.stopPropagation();
                  shift(1);
                }}
                aria-label="Next image"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          ) : null}
          <div
            className="max-h-[85vh] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[active!]!.url}
              alt={images[active!]!.alt ?? title}
              className={cn("max-h-[80vh] w-auto rounded-[16px] object-contain")}
            />
            <p className="mt-3 text-center text-sm text-white/80" role="status">
              {active! + 1} / {images.length}
              {images[active!]!.caption ? ` · ${images[active!]!.caption}` : ""}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
