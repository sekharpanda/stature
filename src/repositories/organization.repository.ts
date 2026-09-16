import { prisma } from "@/lib/db";
import type { UpdateOrganizationInput } from "@/schemas/catalog.schema";

type DefaultOrg = Awaited<
  ReturnType<typeof prisma.organization.findFirst>
>;

let defaultOrgInflight: Promise<DefaultOrg> | null = null;
let defaultOrgValue: DefaultOrg | undefined;
let defaultOrgCachedAt = 0;
const DEFAULT_ORG_TTL_MS = 30_000;

function rememberDefaultOrg(org: DefaultOrg) {
  defaultOrgValue = org;
  defaultOrgCachedAt = Date.now();
  defaultOrgInflight = null;
  return org;
}

export const organizationRepository = {
  async findBySlug(slug: string) {
    return prisma.organization.findFirst({
      where: { slug, deletedAt: null, isActive: true },
    });
  },

  async findById(id: string) {
    return prisma.organization.findFirst({
      where: { id, deletedAt: null },
    });
  },

  async getDefault() {
    const now = Date.now();
    if (
      defaultOrgValue !== undefined &&
      now - defaultOrgCachedAt < DEFAULT_ORG_TTL_MS
    ) {
      return defaultOrgValue;
    }
    if (defaultOrgInflight) return defaultOrgInflight;

    defaultOrgInflight = prisma.organization
      .findFirst({
        where: {
          slug: process.env.SEED_ORG_SLUG ?? "prowin",
          deletedAt: null,
        },
      })
      .then(rememberDefaultOrg)
           .catch((err) => {
        defaultOrgInflight = null;
        return null;
      });

    return defaultOrgInflight;
  },

  async update(id: string, data: UpdateOrganizationInput) {
    defaultOrgValue = undefined;
    defaultOrgCachedAt = 0;
    return prisma.organization.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.whatsapp !== undefined ? { whatsapp: data.whatsapp } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.city !== undefined ? { city: data.city } : {}),
        ...(data.country !== undefined ? { country: data.country } : {}),
        ...(data.domain !== undefined ? { domain: data.domain } : {}),
        ...(data.defaultCurrency !== undefined
          ? { defaultCurrency: data.defaultCurrency }
          : {}),
        ...(data.timezone !== undefined ? { timezone: data.timezone } : {}),
        ...(data.primaryColor !== undefined
          ? { primaryColor: data.primaryColor }
          : {}),
      },
    });
  },

  async upsertWebsiteSettings(
    organizationId: string,
    settings: Array<{ key: string; value: string }>,
  ) {
    await Promise.all(
      settings.map((s) =>
        prisma.websiteSetting.upsert({
          where: {
            organizationId_key: { organizationId, key: s.key },
          },
          create: {
            organizationId,
            key: s.key,
            value: s.value,
          },
          update: {
            value: s.value,
            deletedAt: null,
          },
        }),
      ),
    );
  },
};
