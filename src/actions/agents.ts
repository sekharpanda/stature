"use server";

import { revalidatePath } from "next/cache";

import { AppError } from "@/lib/errors";
import { agentService } from "@/services/agent.service";

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

/** Admin surfaces plus the public pages that render the roster. */
function revalidateAgentSurfaces(agentId?: string) {
  revalidatePath("/admin/agents");
  if (agentId) revalidatePath(`/admin/agents/${agentId}`);
  revalidatePath("/our-team");
  revalidatePath("/our-team/[slug]", "page");
  revalidatePath("/");
}

export type AgentListingCandidate = {
  id: string;
  name: string;
  status: string;
  price: string | null;
  location: string | null;
  currentAgent: string | null;
};

export async function createAgentAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const agent = await agentService.create(input);
    revalidateAgentSurfaces(agent.id);
    return { ok: true, data: { id: agent.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateAgentAction(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const agent = await agentService.update(input);
    revalidateAgentSurfaces(agent.id);
    return { ok: true, data: { id: agent.id, slug: agent.slug } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setAgentVisibilityAction(
  input: unknown,
): Promise<ActionResult<{ id: string; isActive: boolean; isFeatured: boolean }>> {
  try {
    const agent = await agentService.setVisibility(input);
    revalidateAgentSurfaces(agent.id);
    return {
      ok: true,
      data: {
        id: agent.id,
        isActive: agent.isActive,
        isFeatured: agent.isFeatured,
      },
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderAgentsAction(
  input: unknown,
): Promise<ActionResult<{ updated: number }>> {
  try {
    const result = await agentService.reorder(input);
    revalidateAgentSurfaces();
    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteAgentAction(
  input: unknown,
): Promise<ActionResult<{ movedListings: number }>> {
  try {
    const result = await agentService.remove(input);
    revalidateAgentSurfaces();
    revalidatePath("/admin/properties");
    return { ok: true, data: { movedListings: result.movedListings } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function assignAgentListingsAction(
  input: unknown,
): Promise<ActionResult<{ updated: number }>> {
  try {
    const result = await agentService.assignListings(input);
    revalidateAgentSurfaces((input as { agentId?: string })?.agentId);
    revalidatePath("/admin/properties");
    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function unassignAgentListingsAction(
  input: unknown,
): Promise<ActionResult<{ updated: number }>> {
  try {
    const result = await agentService.unassignListings(input);
    revalidateAgentSurfaces((input as { agentId?: string })?.agentId);
    revalidatePath("/admin/properties");
    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function searchAgentListingCandidatesAction(
  input: unknown,
): Promise<ActionResult<AgentListingCandidate[]>> {
  try {
    const rows = await agentService.searchAssignableListings(input);
    return {
      ok: true,
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status,
        price: row.minPrice ? row.minPrice.toString() : null,
        location: row.area?.name ?? row.city?.name ?? null,
        currentAgent: row.agent?.name ?? null,
      })),
    };
  } catch (error) {
    return toActionError(error);
  }
}
