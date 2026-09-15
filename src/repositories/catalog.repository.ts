import { prisma } from "@/lib/db";
import { computeListPriority } from "@/config/priority-developers";
import type {
  CreateAmenityInput,
  CreateAreaInput,
  CreateCategoryInput,
  CreateCityInput,
  CreateCommunityInput,
  CreateCountryInput,
  CreateDeveloperInput,
} from "@/schemas/catalog.schema";

const notDeleted = { deletedAt: null };

export const catalogRepository = {
  async createCountry(input: CreateCountryInput) {
    return prisma.country.create({ data: input });
  },

  async createCity(input: CreateCityInput) {
    return prisma.city.create({ data: input });
  },

  async createArea(input: CreateAreaInput) {
    return prisma.area.create({
      data: {
        ...input,
        rentalYield: input.rentalYield ?? undefined,
        averageRoi: input.averageRoi ?? undefined,
        isPublished: input.isPublished ?? true,
      },
    });
  },

  async createCommunity(input: CreateCommunityInput) {
    return prisma.community.create({
      data: {
        ...input,
        rentalYield: input.rentalYield ?? undefined,
        averageRoi: input.averageRoi ?? undefined,
        isPublished: input.isPublished ?? true,
      },
    });
  },

  async createDeveloper(input: CreateDeveloperInput) {
    return prisma.developer.create({
      data: {
        ...input,
        isPublished: input.isPublished ?? true,
        source: "MANUAL",
      },
    });
  },

  async createAmenity(input: CreateAmenityInput) {
    return prisma.amenity.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        slug: input.slug,
        icon: input.icon ?? undefined,
      },
    });
  },

  async createCategory(input: CreateCategoryInput) {
    return prisma.propertyCategory.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        slug: input.slug,
        description: input.description ?? undefined,
      },
    });
  },

  async listCountries(organizationId: string) {
    return prisma.country.findMany({
      where: { organizationId, ...notDeleted },
      orderBy: { name: "asc" },
    });
  },

  async listCities(organizationId: string, countryId?: string) {
    return prisma.city.findMany({
      where: {
        organizationId,
        ...notDeleted,
        ...(countryId ? { countryId } : {}),
      },
      orderBy: { name: "asc" },
    });
  },

  async listAreas(organizationId: string, cityId?: string) {
    return prisma.area.findMany({
      where: {
        organizationId,
        ...notDeleted,
        ...(cityId ? { cityId } : {}),
      },
      orderBy: { name: "asc" },
    });
  },

  async listCommunities(organizationId: string, areaId?: string) {
    return prisma.community.findMany({
      where: {
        organizationId,
        ...notDeleted,
        ...(areaId ? { areaId } : {}),
      },
      include: {
        area: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });
  },

  async listDevelopers(organizationId: string) {
    return prisma.developer.findMany({
      where: { organizationId, ...notDeleted },
      orderBy: [{ listPriority: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { properties: { where: { deletedAt: null } } } },
      },
    });
  },

  async updateDeveloperListingOrder(
    organizationId: string,
    orderedDeveloperIds: string[],
  ) {
    const uniqueIds = [...new Set(orderedDeveloperIds)];
    const developers = await prisma.developer.findMany({
      where: { organizationId, ...notDeleted },
      select: { id: true },
    });
    const allowed = new Set(developers.map((d) => d.id));
    const ordered = uniqueIds.filter((id) => allowed.has(id));
    const orderedSet = new Set(ordered);

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        ordered.map((id, index) =>
          tx.developer.update({
            where: { id },
            data: { listPriority: index },
          }),
        ),
      );
      const unpinIds = developers
        .map((d) => d.id)
        .filter((id) => !orderedSet.has(id));
      if (unpinIds.length) {
        await tx.developer.updateMany({
          where: { id: { in: unpinIds }, organizationId },
          data: { listPriority: 9999 },
        });
      }
    });

    await this.syncPropertyListPriorities(organizationId);
    return { orderedCount: ordered.length };
  },

  async syncPropertyListPriorities(organizationId: string) {
    const batchSize = 200;
    let skip = 0;
    let updated = 0;

    for (;;) {
      const rows = await prisma.property.findMany({
        where: { organizationId, deletedAt: null },
        select: {
          id: true,
          name: true,
          listPriority: true,
          developer: { select: { name: true, listPriority: true } },
        },
        orderBy: { id: "asc" },
        skip,
        take: batchSize,
      });
      if (!rows.length) break;

      await Promise.all(
        rows.map(async (row) => {
          const next = computeListPriority(
            row.name,
            row.developer?.name,
            row.developer?.listPriority,
          );
          if (next !== row.listPriority) {
            await prisma.property.update({
              where: { id: row.id },
              data: { listPriority: next },
            });
            updated += 1;
          }
        }),
      );

      skip += rows.length;
    }

    return { updated };
  },

  async listAmenities(organizationId: string) {
    return prisma.amenity.findMany({
      where: { organizationId, ...notDeleted },
      orderBy: { name: "asc" },
    });
  },

  async listCategories(organizationId: string) {
    return prisma.propertyCategory.findMany({
      where: { organizationId, ...notDeleted },
      orderBy: { name: "asc" },
    });
  },

  async listPropertyTypes(organizationId: string) {
    return prisma.propertyType.findMany({
      where: { organizationId, ...notDeleted },
      orderBy: { name: "asc" },
    });
  },

  async findDeveloperBySlug(organizationId: string, slug: string) {
    return prisma.developer.findFirst({
      where: { organizationId, slug, ...notDeleted },
    });
  },

  async findAreaBySlug(organizationId: string, slug: string) {
    return prisma.area.findFirst({
      where: { organizationId, slug, ...notDeleted },
      include: {
        city: true,
        communities: { where: notDeleted, orderBy: { name: "asc" } },
        nearbyPlaces: { where: notDeleted },
        faqs: { where: notDeleted, orderBy: { sortOrder: "asc" } },
      },
    });
  },

  async softDelete(
    model:
      | "country"
      | "city"
      | "area"
      | "community"
      | "developer"
      | "amenity"
      | "category",
    id: string,
  ) {
    const data = { deletedAt: new Date() };
    switch (model) {
      case "country":
        return prisma.country.update({ where: { id }, data });
      case "city":
        return prisma.city.update({ where: { id }, data });
      case "area":
        return prisma.area.update({ where: { id }, data });
      case "community":
        return prisma.community.update({ where: { id }, data });
      case "developer":
        return prisma.developer.update({ where: { id }, data });
      case "amenity":
        return prisma.amenity.update({ where: { id }, data });
      case "category":
        return prisma.propertyCategory.update({ where: { id }, data });
    }
  },
};
