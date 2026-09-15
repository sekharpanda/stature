"use server";

import { revalidatePath } from "next/cache";

import { AppError } from "@/lib/errors";
import { catalogService } from "@/services/catalog.service";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; details?: unknown };

function toActionError<T = never>(error: unknown): ActionResult<T> {
  if (error instanceof AppError) {
    return { ok: false, error: error.message, details: error.details };
  }
  if (error instanceof Error) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "Unexpected error" };
}

export async function createDeveloperAction(
  input: unknown,
): Promise<ActionResult<unknown>> {
  try {
    const data = await catalogService.createDeveloper(input);
    revalidatePath("/admin/developers");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateDeveloperListingOrderAction(
  input: unknown,
): Promise<ActionResult<unknown>> {
  try {
    const data = await catalogService.updateDeveloperListingOrder(input);
    revalidatePath("/admin/developers");
    revalidatePath("/properties");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createAreaAction(
  input: unknown,
): Promise<ActionResult<unknown>> {
  try {
    const data = await catalogService.createArea(input);
    revalidatePath("/admin/areas");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createCommunityAction(
  input: unknown,
): Promise<ActionResult<unknown>> {
  try {
    const data = await catalogService.createCommunity(input);
    revalidatePath("/admin/communities");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createCountryAction(
  input: unknown,
): Promise<ActionResult<unknown>> {
  try {
    const data = await catalogService.createCountry(input);
    revalidatePath("/admin/areas");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createCityAction(
  input: unknown,
): Promise<ActionResult<unknown>> {
  try {
    const data = await catalogService.createCity(input);
    revalidatePath("/admin/areas");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createAmenityAction(
  input: unknown,
): Promise<ActionResult<unknown>> {
  try {
    const data = await catalogService.createAmenity(input);
    revalidatePath("/admin/amenities");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createCategoryAction(
  input: unknown,
): Promise<ActionResult<unknown>> {
  try {
    const data = await catalogService.createCategory(input);
    revalidatePath("/admin/categories");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}
