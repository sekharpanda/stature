import Image from "next/image";

import { stature, statureLegalNav, statureNav } from "@/config/stature";
import { StatureLeadCta } from "@/features/marketing/stature-home/stature-lead-modal";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export function StatureFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink px-0 pt-[54px] pb-[30px] text-white/70">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="grid grid-cols-1 gap-8 border-b border-white/12 pb-[34px] sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Image
              src={stature.logo}
              alt={stature.legalName}
              width={627}
              height={314}
              unoptimized
              className="stature-logo stature-logo--footer"
            />
            <p className="mt-3 max-w-[38ch] text-[13px] leading-relaxed">
              {stature.tagline}
            </p>
            {stature.linkedin ? (
              <a
                href={stature.linkedin}
                target="_blank"
                rel="noreferrer"
                className={`mt-4 inline-block rounded-sm text-[13px] text-white/66 underline-offset-2 hover:text-white hover:underline ${FOCUS}`}
              >
                LinkedIn
              </a>
            ) : null}
          </div>

          <div>
            <h4 className="mb-3.5 text-[13px] font-semibold tracking-[0.05em] text-white uppercase">
              On this page
            </h4>
            {statureNav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`block rounded-sm py-1 text-[13px] text-white/66 hover:text-white ${FOCUS}`}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div>
            <h4 className="mb-3.5 text-[13px] font-semibold tracking-[0.05em] text-white uppercase">
              Legal
            </h4>
            {statureLegalNav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`block rounded-sm py-1 text-[13px] text-white/66 hover:text-white ${FOCUS}`}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div>
            <h4 className="mb-3.5 text-[13px] font-semibold tracking-[0.05em] text-white uppercase">
              Contact
            </h4>
            {stature.phone ? (
              <a
                className={`block rounded-sm py-1 text-[13px] text-white/66 hover:text-white ${FOCUS}`}
                href={stature.phoneHref}
              >
                {stature.phone}
              </a>
            ) : null}
            {stature.email ? (
              <a
                className={`block rounded-sm py-1 text-[13px] text-white/66 hover:text-white ${FOCUS}`}
                href={`mailto:${stature.email}`}
              >
                {stature.email}
              </a>
            ) : null}
            <StatureLeadCta
              source="footer"
              className={`block rounded-sm py-1 text-left text-[13px] text-white/66 hover:text-white ${FOCUS}`}
            >
              Request a callback
            </StatureLeadCta>
            <p className="py-1 text-[13px] text-white/66">{stature.address}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-[22px] text-xs text-white/50">
          <span>
            © {year} {stature.legalName}. All rights reserved.
          </span>
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            {statureLegalNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`hover:text-white ${FOCUS}`}
              >
                {item.label}
              </a>
            ))}
            <span>Bengaluru · Est. {stature.foundedYear}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
