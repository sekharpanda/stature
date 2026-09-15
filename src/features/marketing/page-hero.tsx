import { cn } from "@/lib/utils";

/**
 * Standard hero for secondary marketing pages. `size="lg"` matches the longer
 * About/Contact treatment; everything else uses the default.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  size = "md",
  children,
  className,
}: {
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  size?: "md" | "lg";
  children?: React.ReactNode;
  className?: string;
}) {
  const lg = size === "lg";

  return (
    <section className={cn("border-b border-line bg-white", className)}>
      <div
        className={cn(
          "mx-auto max-w-[1180px] px-6",
          lg ? "py-16 md:py-20" : "py-14 md:py-16",
        )}
      >
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-[0.22em] text-red uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={cn(
            "font-display",
            lg ? "mt-4 max-w-[18ch] text-4xl md:text-6xl" : "mt-3 text-4xl md:text-5xl",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p
            className={cn(
              "text-slate md:text-lg",
              lg ? "mt-6 max-w-[58ch] text-base" : "mt-4 max-w-[52ch]",
            )}
          >
            {description}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
