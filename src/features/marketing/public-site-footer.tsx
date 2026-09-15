import Link from "next/link";

import { brand } from "@/config/brand";
import {
  DEFAULT_SITE_CHROME,
  type SiteChrome,
} from "@/config/site-chrome-defaults";
import { BrandLogo } from "@/features/marketing/brand-logo";
import { LeadModalCta } from "@/features/leads/components/site-lead-capture-modal";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export function PublicSiteFooter({
  chrome = DEFAULT_SITE_CHROME,
  name = brand.legalName,
  phone = brand.phone,
  email = brand.email,
  address = brand.address,
}: {
  chrome?: SiteChrome;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}) {
  const year = new Date().getFullYear();
  const socials = [
    { href: chrome.social.instagram, label: "Instagram" },
    { href: chrome.social.linkedin, label: "LinkedIn" },
    { href: chrome.social.facebook, label: "Facebook" },
  ].filter((item) => item.href);

  return (
    <footer className="bg-ink px-0 pt-[54px] pb-[30px] text-white/70">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="grid grid-cols-1 gap-8 border-b border-white/12 pb-[34px] sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <BrandLogo variant="onDark" />
            <p className="mt-3 max-w-[34ch] text-[13px] leading-relaxed">
              {chrome.footerTagline}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {socials.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`rounded-sm text-[13px] text-white/66 underline-offset-2 hover:text-white hover:underline ${FOCUS_RING}`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {chrome.footerColumns.map((column) => (
            <div key={column.title}>
              <h4 className="mb-3.5 text-[13px] font-semibold tracking-[0.05em] text-white uppercase">
                {column.title}
              </h4>
              {column.links.map((link) =>
                link.kind === "lead" ? (
                  <LeadModalCta
                    key={link.label}
                    leadSource="footer_contact"
                    campaign="footer"
                    className={`block rounded-sm py-1 text-left text-[13px] text-white/66 hover:text-white ${FOCUS_RING}`}
                  >
                    {link.label}
                  </LeadModalCta>
                ) : (
                  <Link
                    key={link.label + link.href}
                    className={`block rounded-sm py-1 text-[13px] text-white/66 hover:text-white ${FOCUS_RING}`}
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </div>
          ))}

          <div>
            <h4 className="mb-3.5 text-[13px] font-semibold tracking-[0.05em] text-white uppercase">
              Contact
            </h4>
            <a
              className={`block rounded-sm py-1 text-[13px] text-white/66 hover:text-white ${FOCUS_RING}`}
              href={`tel:${phone}`}
            >
              {phone}
            </a>
            <a
              className={`block rounded-sm py-1 text-[13px] text-white/66 hover:text-white ${FOCUS_RING}`}
              href={`mailto:${email}`}
            >
              {email}
            </a>
            <p className="py-1 text-[13px] text-white/66">{address}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-[22px] text-xs text-white/50">
          <span>
            © {year} {name}. All rights reserved.
          </span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href="/privacy"
              className={`rounded-sm hover:text-white ${FOCUS_RING}`}
            >
              Privacy
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/terms"
              className={`rounded-sm hover:text-white ${FOCUS_RING}`}
            >
              Terms
            </Link>
            <span aria-hidden="true">·</span>
            <span>RERA Registered</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
