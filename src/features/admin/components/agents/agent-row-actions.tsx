"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { deleteAgentAction, setAgentVisibilityAction } from "@/actions/agents";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

export function AgentRowActions({
  agent,
  otherAgents,
}: {
  agent: {
    id: string;
    name: string;
    isActive: boolean;
    isFeatured: boolean;
    listingCount: number;
  };
  otherAgents: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reassignTo, setReassignTo] = useState("");
  const [deleting, setDeleting] = useState(false);

  function toggle(patch: { isActive?: boolean; isFeatured?: boolean }) {
    startTransition(async () => {
      const result = await setAgentVisibilityAction({ id: agent.id, ...patch });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        patch.isActive != null
          ? patch.isActive
            ? `${agent.name} is now active`
            : `${agent.name} is hidden from the website`
          : patch.isFeatured
            ? `${agent.name} is now featured`
            : `${agent.name} is no longer featured`,
      );
      router.refresh();
    });
  }

  async function remove() {
    setDeleting(true);
    const result = await deleteAgentAction({
      id: agent.id,
      reassignToAgentId: reassignTo || null,
    });
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setConfirmOpen(false);
    toast.success(
      result.data.movedListings > 0
        ? `${agent.name} removed · ${result.data.movedListings} listing(s) ${
            reassignTo ? "reassigned" : "left unassigned"
          }`
        : `${agent.name} removed`,
    );
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Actions for ${agent.name}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild>
            <Link href={`/admin/agents/${agent.id}`}>
              <Pencil className="mr-2 size-3.5" />
              Edit profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={pending}
            onClick={() => toggle({ isActive: !agent.isActive })}
          >
            {agent.isActive ? (
              <>
                <EyeOff className="mr-2 size-3.5" />
                Deactivate
              </>
            ) : (
              <>
                <Eye className="mr-2 size-3.5" />
                Activate
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={pending}
            onClick={() => toggle({ isFeatured: !agent.isFeatured })}
          >
            {agent.isFeatured ? (
              <>
                <StarOff className="mr-2 size-3.5" />
                Remove from featured
              </>
            ) : (
              <>
                <Star className="mr-2 size-3.5" />
                Mark as featured
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="mr-2 size-3.5" />
            Delete agent
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {agent.name}?</DialogTitle>
            <DialogDescription>
              The profile is archived and removed from the website. Choose who
              takes over the listings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={`reassign-${agent.id}`}>
              Reassign {agent.listingCount} listing
              {agent.listingCount === 1 ? "" : "s"}
            </Label>
            <select
              id={`reassign-${agent.id}`}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={reassignTo}
              onChange={(event) => setReassignTo(event.target.value)}
            >
              <option value="">Leave unassigned</option>
              {otherAgents.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={remove}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
