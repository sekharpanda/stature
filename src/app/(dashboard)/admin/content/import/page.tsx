import type { Metadata } from "next";

import { ContentJsonUpload } from "@/features/admin/components/content-json-upload";

export const metadata: Metadata = {
  title: "Content JSON Import",
  robots: { index: false, follow: false },
};

export default function ContentImportPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.22em] text-red uppercase">
          Content
        </p>
        <h1 className="mt-2 font-display text-4xl">JSON import</h1>
        <p className="mt-2 max-w-2xl text-slate">
          Upload blog posts, agents, developers, areas, FAQs and testimonials in
          one JSON file — same idea as property JSON upload.
        </p>
      </div>
      <ContentJsonUpload />
    </div>
  );
}
