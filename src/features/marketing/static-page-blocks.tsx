import Link from "next/link";

import { isWidgetBlock, type PageBlock } from "@/config/page-content-defaults";
import { LeadModalCta } from "@/features/leads/components/site-lead-capture-modal";
import { cn } from "@/lib/utils";

function TextBlock({ block }: { block: PageBlock }) {
  return (
    <div>
      {block.title ? (
        <h2 className="font-display text-2xl md:text-3xl">{block.title}</h2>
      ) : null}
      {block.body ? (
        <p className="mt-3 text-sm leading-relaxed text-slate md:text-base">
          {block.body}
        </p>
      ) : null}
    </div>
  );
}

function ColumnsBlock({ block }: { block: PageBlock }) {
  const items = block.items ?? [];
  return (
    <div>
      {block.title ? (
        <h2 className="mb-8 font-display text-3xl md:text-4xl">{block.title}</h2>
      ) : null}
      <div
        className={cn(
          "grid gap-6",
          items.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2",
        )}
      >
        {items.map((item, index) => (
          <div
            key={`${item.title ?? "col"}-${index}`}
            className="border border-line bg-white p-6"
          >
            {item.title ? (
              <h3 className="font-display text-xl">{item.title}</h3>
            ) : null}
            {item.body ? (
              <p className="mt-3 text-sm leading-relaxed text-slate">
                {item.body}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaBlock({ block }: { block: PageBlock }) {
  const href = block.buttonHref || "/contact";
  const label = block.buttonLabel || "Contact us";
  const isContact = href === "/contact" || href.startsWith("/contact?");

  return (
    <div className="border border-line bg-ink px-6 py-10 text-white md:px-10">
      {block.title ? (
        <h2 className="font-display text-3xl md:text-4xl">{block.title}</h2>
      ) : null}
      {block.body ? (
        <p className="mt-3 max-w-[52ch] text-sm text-white/75 md:text-base">
          {block.body}
        </p>
      ) : null}
      <div className="mt-6">
        {isContact ? (
          <LeadModalCta
            leadSource="page_block_cta"
            campaign="page-builder"
            className="inline-flex items-center bg-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-dark"
          >
            {label}
          </LeadModalCta>
        ) : (
          <Link
            href={href}
            className="inline-flex items-center bg-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-dark"
          >
            {label}
          </Link>
        )}
      </div>
    </div>
  );
}

function SplitBlock({ block }: { block: PageBlock }) {
  const href = block.buttonHref || "/contact";
  const label = block.buttonLabel || "Contact us";
  const imageLeft = (block.imageSide ?? "left") === "left";
  const image = block.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={block.imageUrl}
      alt={block.alt || block.title || ""}
      className="h-full min-h-[240px] w-full border border-line object-cover"
    />
  ) : (
    <div className="min-h-[240px] border border-dashed border-line bg-mist" />
  );

  return (
    <div
      className={cn(
        "grid items-center gap-8 md:grid-cols-2",
        !imageLeft && "md:[&>*:first-child]:order-2",
      )}
    >
      {image}
      <div>
        {block.title ? (
          <h2 className="font-display text-3xl md:text-4xl">{block.title}</h2>
        ) : null}
        {block.body ? (
          <p className="mt-3 text-sm leading-relaxed text-slate md:text-base">
            {block.body}
          </p>
        ) : null}
        {block.buttonLabel ? (
          <Link
            href={href}
            className="mt-6 inline-flex items-center bg-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-dark"
          >
            {label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function StatsBlock({ block }: { block: PageBlock }) {
  const items = block.items ?? [];
  return (
    <div>
      {block.title ? (
        <p className="text-xs font-semibold tracking-[0.22em] text-red uppercase">
          {block.title}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-10">
        {items.map((item, index) => (
          <div key={`${item.label ?? item.value ?? "stat"}-${index}`}>
            <p className="font-display text-3xl font-semibold text-red">
              {item.value}
            </p>
            <p className="mt-1 text-xs tracking-wide text-slate">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StaticPageBlocks({
  blocks,
  className,
}: {
  blocks: PageBlock[];
  className?: string;
}) {
  if (!blocks.length) return null;

  return (
    <div className={cn("space-y-10", className)}>
      {blocks.map((block) => {
        if (isWidgetBlock(block.type)) return null;
        if (block.type === "spacer") {
          return (
            <div
              key={block.id}
              style={{ height: block.height ?? 48 }}
              aria-hidden
            />
          );
        }
        if (block.type === "columns") {
          return <ColumnsBlock key={block.id} block={block} />;
        }
        if (block.type === "cta") {
          return <CtaBlock key={block.id} block={block} />;
        }
        if (block.type === "stats") {
          return <StatsBlock key={block.id} block={block} />;
        }
        if (block.type === "split") {
          return <SplitBlock key={block.id} block={block} />;
        }
        if (block.type === "image" && block.imageUrl) {
          return (
            <figure key={block.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.imageUrl}
                alt={block.alt || block.title || ""}
                className="w-full border border-line object-cover"
              />
              {block.title ? (
                <figcaption className="mt-2 text-sm text-slate">
                  {block.title}
                </figcaption>
              ) : null}
            </figure>
          );
        }
        return <TextBlock key={block.id} block={block} />;
      })}
    </div>
  );
}
