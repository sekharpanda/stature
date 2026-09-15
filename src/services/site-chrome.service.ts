import { cache } from "react";

import { brand as brandFallback } from "@/config/brand";
import {
  DEFAULT_SITE_CHROME,
  type SiteChrome,
} from "@/config/site-chrome-defaults";
import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";

const SETTING_KEY = "site.chrome";

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function normalizeChrome(raw: unknown): SiteChrome {
  const patch =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Partial<SiteChrome>)
      : {};
  const base = DEFAULT_SITE_CHROME;
  return {
    headerCtaLabel: asString(patch.headerCtaLabel, base.headerCtaLabel),
    headerCtaLeadSource: asString(
      patch.headerCtaLeadSource,
      base.headerCtaLeadSource,
    ),
    nav: Array.isArray(patch.nav) && patch.nav.length ? patch.nav : base.nav,
    footerTagline: asString(patch.footerTagline, base.footerTagline),
    footerColumns:
      Array.isArray(patch.footerColumns) && patch.footerColumns.length
        ? patch.footerColumns
        : base.footerColumns,
    social: {
      instagram: asString(patch.social?.instagram, base.social.instagram),
      linkedin: asString(patch.social?.linkedin, base.social.linkedin),
      facebook: asString(patch.social?.facebook, base.social.facebook),
    },
    hours:
      Array.isArray(patch.hours) && patch.hours.length ? patch.hours : base.hours,
    timezoneLabel: asString(patch.timezoneLabel, base.timezoneLabel),
    redirects: Array.isArray(patch.redirects) ? patch.redirects : [],
  };
}

export type PublicSiteContext = {
  organizationId: string | null;
  name: string;
  legalName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  chrome: SiteChrome;
};

export const getPublicSiteContext = cache(async (): Promise<PublicSiteContext> => {
  const org = await organizationRepository.getDefault();
  const chrome = org
    ? await siteChromeService.get(org.id)
    : DEFAULT_SITE_CHROME;

  return {
    organizationId: org?.id ?? null,
    name: org?.name?.trim() || brandFallback.name,
    legalName: org?.legalName?.trim() || org?.name?.trim() || brandFallback.legalName,
    phone: org?.phone?.trim() || brandFallback.phone,
    whatsapp: org?.whatsapp?.trim() || org?.phone?.trim() || brandFallback.whatsapp,
    email: org?.email?.trim() || brandFallback.email,
    address: org?.address?.trim() || brandFallback.address,
    chrome,
  };
});

async function loadSiteChrome(organizationId?: string): Promise<SiteChrome> {
  const orgId =
    organizationId ?? (await organizationRepository.getDefault())?.id;
  if (!orgId) return DEFAULT_SITE_CHROME;

  const row = await prisma.websiteSetting.findFirst({
    where: { organizationId: orgId, key: SETTING_KEY, deletedAt: null },
    select: { value: true },
  });
  return normalizeChrome(row?.value);
}

export const siteChromeService = {
  get: cache(loadSiteChrome),

  async save(organizationId: string, chrome: SiteChrome) {
    const value = normalizeChrome(chrome);
    await prisma.websiteSetting.upsert({
      where: { organizationId_key: { organizationId, key: SETTING_KEY } },
      create: { organizationId, key: SETTING_KEY, value },
      update: { value, deletedAt: null },
    });
    return value;
  },
};
