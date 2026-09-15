"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  addLeadNoteAction,
  assignLeadAction,
  updateLeadStatusAction,
} from "@/actions/leads";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STATUSES = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "FOLLOW_UP", label: "Follow up" },
  { value: "MEETING_SCHEDULED", label: "Meeting" },
  { value: "SITE_VISIT", label: "Site visit" },
  { value: "CLOSED", label: "Closed" },
  { value: "LOST", label: "Lost" },
] as const;

export function LeadWorkflowPanel({
  leadId,
  status,
  assignedToId,
  agents,
}: {
  leadId: string;
  status: string;
  assignedToId?: string | null;
  agents: Array<{ id: string; name: string; email: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-5 rounded-xl border border-neutral-200 bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Pipeline</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Update status, assignment and notes without leaving the lead.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lead-status">Status</Label>
          <select
            id="lead-status"
            defaultValue={status}
            disabled={pending}
            className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
            onChange={(event) => {
              startTransition(async () => {
                const result = await updateLeadStatusAction({
                  leadId,
                  status: event.target.value,
                });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Lead status updated");
                router.refresh();
              });
            }}
          >
            {STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lead-assignee">Assigned to</Label>
          <select
            id="lead-assignee"
            defaultValue={assignedToId ?? ""}
            disabled={pending}
            className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
            onChange={(event) => {
              startTransition(async () => {
                const result = await assignLeadAction({
                  leadId,
                  assignedToId: event.target.value || null,
                });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success(
                  event.target.value ? "Lead assigned" : "Assignment cleared",
                );
                router.refresh();
              });
            }}
          >
            <option value="">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const body = String(form.get("body") ?? "").trim();
          if (!body) return;
          startTransition(async () => {
            const result = await addLeadNoteAction({ leadId, body });
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Note added");
            event.currentTarget.reset();
            router.refresh();
          });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="lead-note">Add note</Label>
          <Textarea
            id="lead-note"
            name="body"
            rows={3}
            placeholder="Call outcome, next step, buyer budget…"
            required
          />
        </div>
        <Button type="submit" disabled={pending} className="rounded-lg">
          {pending ? "Saving…" : "Save note"}
        </Button>
      </form>
    </div>
  );
}
