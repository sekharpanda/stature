"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { GoogleReviewItem } from "@/services/google-business-reviews.service";

function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span className="hp-g-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < filled ? "on" : ""}>
          ★
        </span>
      ))}
    </span>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function clip(text: string, max = 100) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

function ReviewCard({ review }: { review: GoogleReviewItem }) {
  return (
    <article className="hp-g-card">
      <div className="hp-g-card-top">
        <div className="hp-g-card-who">
          {review.profilePhotoUrl ? (
            <Image
              src={review.profilePhotoUrl}
              alt=""
              width={36}
              height={36}
              className="hp-g-avatar"
              unoptimized
            />
          ) : (
            <span className="hp-g-avatar hp-g-avatar--fallback" aria-hidden>
              {initials(review.authorName)}
            </span>
          )}
          <div>
            <p className="hp-g-name">{review.authorName}</p>
            {review.relativeTime ? (
              <p className="hp-g-time">{review.relativeTime}</p>
            ) : null}
          </div>
        </div>
        <GoogleMark className="hp-g-card-g" />
      </div>
      <Stars rating={review.rating} />
      <p className="hp-g-text">{clip(review.text)}</p>
    </article>
  );
}

/** Up to 10 reviews (2 per slide) from merged Places API fetches. */
export function HomepageGoogleReviews({
  rating,
  reviewCount,
  reviews,
  href,
}: {
  rating: number;
  reviewCount: number;
  reviews: GoogleReviewItem[];
  href: string;
}) {
  const cards = reviews.slice(0, 10);
  const slides: GoogleReviewItem[][] = [];
  for (let i = 0; i < cards.length; i += 2) {
    slides.push(cards.slice(i, i + 2));
  }

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [slides.length, paused]);

  if (cards.length === 0) return null;

  const ratingLabel = rating.toFixed(1).replace(/\.0$/, "");
  const countLabel =
    reviewCount >= 100
      ? `${Math.floor(reviewCount / 10) * 10}+`
      : String(reviewCount);

  function go(delta: number) {
    setIndex((i) => (i + delta + slides.length) % slides.length);
  }

  return (
    <div
      className="hp-g-reviews"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hp-g-reviews-head">
        <div className="hp-g-reviews-brand">
          <GoogleMark />
          <span>Google Reviews</span>
        </div>
        <div className="hp-g-reviews-score">
          <strong>{ratingLabel}</strong>
          <Stars rating={rating} />
          <span className="hp-g-reviews-count">({countLabel} Reviews)</span>
        </div>
      </div>

      <div className="hp-g-slider" aria-live="polite">
        <div
          className="hp-g-slider-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, slideIndex) => (
            <div key={slideIndex} className="hp-g-slide">
              {slide.map((review) => (
                <ReviewCard
                  key={`${review.authorName}-${review.relativeTime}`}
                  review={review}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <div className="hp-g-slider-controls">
          <button
            type="button"
            className="hp-g-nav"
            onClick={() => go(-1)}
            aria-label="Previous reviews"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="hp-g-dots" role="tablist" aria-label="Review slides">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1}`}
                className={i === index ? "on" : undefined}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="hp-g-nav"
            onClick={() => go(1)}
            aria-label="Next reviews"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      ) : null}

      <a
        className="hp-g-reviews-link"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        See all reviews on Google →
      </a>
    </div>
  );
}
