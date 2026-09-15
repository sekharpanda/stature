import { PublicSiteShellInstant } from "@/features/marketing/public-site-shell";

export default function Loading() {
  return (
    <PublicSiteShellInstant>
      <main className="mx-auto max-w-[1180px] px-6 py-14" aria-busy="true">
        <span className="sr-only">Loading articles</span>
        <div className="h-4 w-28 animate-pulse rounded bg-[#eef1f4]" />
        <div className="mt-4 h-10 w-96 max-w-full animate-pulse rounded bg-[#eef1f4]" />
        <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-[#f3f5f7]" />

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-[16/10] animate-pulse rounded-[3px] bg-[#eef1f4]" />
              <div className="h-3 w-24 animate-pulse rounded bg-[#f3f5f7]" />
              <div className="h-5 w-full animate-pulse rounded bg-[#eef1f4]" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-[#f3f5f7]" />
            </div>
          ))}
        </div>
      </main>
    </PublicSiteShellInstant>
  );
}
