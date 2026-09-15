import type { PageBlock } from "@/config/page-content-defaults";
import { cn } from "@/lib/utils";

export function blockShellClass(block: PageBlock) {
  if (block.type === "spacer") return undefined;
  return cn(
    block.padY === "sm" && "py-4",
    block.padY === "md" && "py-8",
    block.padY === "lg" && "py-14",
    block.bg === "white" && "bg-white px-6",
    block.bg === "mist" && "bg-mist px-6",
    block.bg === "ink" &&
      "bg-ink px-6 py-10 text-white [&_h2]:text-white [&_h3]:text-white [&_p]:text-white/75 [&_a]:text-white",
    block.align === "center" && "text-center [&_p]:mx-auto",
    block.width === "narrow" && "mx-auto max-w-[760px]",
  );
}
