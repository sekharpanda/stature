import { requirePermission } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { catalogRepository } from "@/repositories/catalog.repository";
import {
  createAmenitySchema,
  createAreaSchema,
  createCategorySchema,
  createCitySchema,
  createCommunitySchema,
  createCountrySchema,
  createDeveloperSchema,
  updateDeveloperListingOrderSchema,
} from "@/schemas/catalog.schema";
import { slugify } from "@/lib/utils";

export const catalogService = {
  async createCountry(raw: unknown) {
    await requirePermission("location:manage");
    const input = raw as { name: string; slug?: string };
    const parsed = createCountrySchema.parse({
      ...(raw as object),
      slug: input.slug ?? slugify(input.name),
    });
    return catalogRepository.createCountry(parsed);
  },

  async createCity(raw: unknown) {
    await requirePermission("location:manage");
    const input = raw as { name: string; slug?: string };
    const parsed = createCitySchema.parse({
      ...(raw as object),
      slug: input.slug ?? slugify(input.name),
    });
    return catalogRepository.createCity(parsed);
  },

  async createArea(raw: unknown) {
    await requirePermission("location:manage");
    const input = raw as { name: string; slug?: string };
    const parsed = createAreaSchema.parse({
      ...(raw as object),
      slug: input.slug ?? slugify(input.name),
    });
    return catalogRepository.createArea(parsed);
  },

  async createCommunity(raw: unknown) {
    await requirePermission("location:manage");
    const input = raw as { name: string; slug?: string };
    const parsed = createCommunitySchema.parse({
      ...(raw as object),
      slug: input.slug ?? slugify(input.name),
    });
    return catalogRepository.createCommunity(parsed);
  },

  async createDeveloper(raw: unknown) {
    await requirePermission("developer:manage");
    const input = raw as { name: string; slug?: string };
    const parsed = createDeveloperSchema.parse({
      ...(raw as object),
      slug: input.slug ?? slugify(input.name),
    });
    return catalogRepository.createDeveloper(parsed);
  },

  async updateDeveloperListingOrder(raw: unknown) {
    await requirePermission("developer:manage");
    const parsed = updateDeveloperListingOrderSchema.parse(raw);
    return catalogRepository.updateDeveloperListingOrder(
      parsed.organizationId,
      parsed.orderedDeveloperIds,
    );
  },

  async createAmenity(raw: unknown) {
    await requirePermission("amenity:manage");
    const input = raw as { name: string; slug?: string };
    const parsed = createAmenitySchema.parse({
      ...(raw as object),
      slug: input.slug ?? slugify(input.name),
    });
    return catalogRepository.createAmenity(parsed);
  },

  async createCategory(raw: unknown) {
    await requirePermission("location:manage");
    const input = raw as { name: string; slug?: string };
    const parsed = createCategorySchema.parse({
      ...(raw as object),
      slug: input.slug ?? slugify(input.name),
    });
    return catalogRepository.createCategory(parsed);
  },

  async listCountries(organizationId: string) {
    return catalogRepository.listCountries(organizationId);
  },

  async listCities(organizationId: string, countryId?: string) {
    return catalogRepository.listCities(organizationId, countryId);
  },

  async listAreas(organizationId: string, cityId?: string) {
    return catalogRepository.listAreas(organizationId, cityId);
  },

  async listCommunities(organizationId: string, areaId?: string) {
    return catalogRepository.listCommunities(organizationId, areaId);
  },

  async listDevelopers(organizationId: string) {
    return catalogRepository.listDevelopers(organizationId);
  },

  async listAmenities(organizationId: string) {
    return catalogRepository.listAmenities(organizationId);
  },

  async listCategories(organizationId: string) {
    return catalogRepository.listCategories(organizationId);
  },

  async listPropertyTypes(organizationId: string) {
    return catalogRepository.listPropertyTypes(organizationId);
  },

  async getDeveloperPage(organizationId: string, slug: string) {
    const developer = await catalogRepository.findDeveloperBySlug(
      organizationId,
      slug,
    );
    if (!developer || !developer.isPublished) {
      throw new AppError("Developer not found", {
        code: "NOT_FOUND",
        status: 404,
      });
    }
    return developer;
  },

  async getAreaPage(organizationId: string, slug: string) {
    const area = await catalogRepository.findAreaBySlug(organizationId, slug);
    if (!area || !area.isPublished) {
      throw new AppError("Area not found", { code: "NOT_FOUND", status: 404 });
    }
    return area;
  },
};
