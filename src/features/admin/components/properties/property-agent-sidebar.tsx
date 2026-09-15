"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { MessageCircle, Phone } from "lucide-react";

import { assignPropertyAgentAction } from "@/actions/properties";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type AgentOption = {
  id: string;
  name: string;
  title?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  photoUrl?: string | null;
  email?: string | null;
};

export function PropertyAgentSidebar({
  propertyId,
  agents,
  currentAgent,
}: {
  propertyId: string;
  agents: AgentOption[];
  currentAgent: AgentOption | null;
}) {
  const router = useRouter();
  const [agentId, setAgentId] = useState(currentAgent?.id ?? "");
  const [loading, setLoading] = useState(false);

  const selected =
    agents.find((a) => a.id === agentId) ?? currentAgent ?? null;
  const wa = selected?.whatsapp?.replace(/[^\d]/g, "") || "";

  return (
    <div className="space-y-4 border-t pt-4">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Listing agent
        </p>
        {selected ? (
          <div className="mt-3 flex items-start gap-3">
            {selected.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.photoUrl}
                alt={selected.name}
                className="size-12 rounded-full object-cover border"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {selected.name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0">
              <Link
                href={`/admin/agents/${selected.id}`}
                className="font-medium hover:underline"
              >
                {selected.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {selected.title || "Property Consultant"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selected.phone ? (
                  <a
                    href={`tel:${selected.phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-1 text-xs text-primary"
                  >
                    <Phone className="size-3" />
                    Call
                  </a>
                ) : null}
                {wa ? (
                  <a
                    href={`https://wa.me/${wa}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#128C7E]"
                  >
                    <MessageCircle className="size-3" />
                    WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No agent assigned yet.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="assign-agent">Assign agent</Label>
        <select
          id="assign-agent"
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
        >
          <option value="">— Unassigned —</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
              {a.title ? ` · ${a.title}` : ""}
            </option>
          ))}
        </select>
        {agents.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            <Link href="/admin/agents/new" className="underline">
              Create an agent
            </Link>{" "}
            first, then assign them here.
          </p>
        ) : null}
        <Button
          type="button"
          size="sm"
          className="w-full"
          disabled={loading || agentId === (currentAgent?.id ?? "")}
          onClick={async () => {
            setLoading(true);
            const result = await assignPropertyAgentAction({
              propertyId,
              agentId: agentId || null,
            });
            setLoading(false);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(
              agentId ? "Agent assigned to property" : "Agent unassigned",
            );
            router.refresh();
          }}
        >
          {loading ? "Saving…" : "Save agent"}
        </Button>
      </div>
    </div>
  );
}
