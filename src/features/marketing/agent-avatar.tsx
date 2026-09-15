import { cn } from "@/lib/utils";

export function agentInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

/**
 * Photo when we have one, initials otherwise. The homepage passes its own
 * class so the avatar keeps the reference layout's circular crop.
 */
export function AgentAvatar({
  name,
  photoUrl,
  className,
  initialsClassName,
}: {
  name: string;
  photoUrl?: string | null;
  className?: string;
  initialsClassName?: string;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        loading="lazy"
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  // The homepage styles its initials tile in homepage.css, so callers can
  // replace the default look entirely rather than fight utility classes.
  return (
    <div
      className={
        initialsClassName ??
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f3efe8] to-[#e4ddd2] font-display text-[clamp(28px,4vw,36px)] font-medium tracking-[0.04em] text-ink"
      }
      aria-hidden="true"
    >
      <span>{agentInitials(name)}</span>
    </div>
  );
}
