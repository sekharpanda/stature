import type { PageBlock } from "@/config/page-content-defaults";
import { PageBuilder } from "@/features/marketing/page-builder";

export async function PageBuilderSection({
  blocks,
}: {
  blocks: PageBlock[];
}) {
  if (!blocks.length) return null;
  return (
    <section className="border-b border-line bg-white">
      <div className="mx-auto max-w-[1180px] px-6 py-14">
        <PageBuilder blocks={blocks} />
      </div>
    </section>
  );
}
