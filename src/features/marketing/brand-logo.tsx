import Image from "next/image";

import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** onDark brightens the official lockup for dark footers/modals */
  variant?: "primary" | "onDark";
  className?: string;
};

/**
 * Official Prowin Properties wordmark — exact brand artwork (do not recreate fonts).
 * Height fixed at 67px; width stays auto so the lockup is never squished.
 */
export function BrandLogo({ className, variant = "primary" }: BrandLogoProps) {
  return (
    <Image
      src={brand.logo}
      alt={brand.name}
      width={240}
      height={100}
      priority
      quality={100}
      sizes="200px"
      style={{ width: "auto", height: 67 }}
      className={cn(
        "h-[67px] w-auto object-contain object-left",
        variant === "onDark" && "brightness-0 invert",
        className,
      )}
    />
  );
}
