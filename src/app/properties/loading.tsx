import { PublicSiteShellInstant } from "@/features/marketing/public-site-shell";

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.04]">
      <div className="aspect-[16/10] animate-pulse bg-[#eef1f4]" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-[#eef1f4]" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-[#f3f5f7]" />
        <div className="h-px bg-[#eceff3]" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-[#eef1f4]" />
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="h-7 w-28 animate-pulse rounded-full bg-[#f3f5f7]" />
          <div className="h-7 w-24 animate-pulse rounded-full bg-[#f3f5f7]" />
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <PublicSiteShellInstant>
      <main className="pb-16" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading properties</span>

        <div className="bg-mist py-6">
          <div className="mx-auto max-w-[1180px] px-6">
            <div className="rounded-[18px] bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
              <div className="h-8 w-72 animate-pulse rounded bg-[#eef1f4]" />
              <div className="mt-4 h-11 w-full animate-pulse rounded-full bg-[#f3f5f7]" />
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-9 w-28 animate-pulse rounded-full bg-[#f3f5f7]"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 grid max-w-[1180px] gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </main>
    </PublicSiteShellInstant>
  );
}
