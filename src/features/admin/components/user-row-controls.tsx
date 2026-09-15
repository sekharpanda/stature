"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  deleteUserAction,
  resendInviteAction,
  updateUserAction,
} from "@/actions/users";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "INVITED", label: "Invited" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DISABLED", label: "Disabled" },
] as const;

type RoleOption = { id: string; name: string };

export function UserRowControls({
  userId,
  name,
  email,
  status,
  roleIds,
  roles,
}: {
  userId: string;
  name: string;
  email: string;
  status: string;
  roleIds: string[];
  roles: RoleOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(email);
  const [editStatus, setEditStatus] = useState(status);
  const [editRoleId, setEditRoleId] = useState(roleIds[0] ?? roles[0]?.id ?? "");

  return (
    <div className="flex min-w-[200px] flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Dialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (open) {
              setEditName(name);
              setEditEmail(email);
              setEditStatus(status);
              setEditRoleId(roleIds[0] ?? roles[0]?.id ?? "");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              className="h-8 rounded-md text-xs"
            >
              Update
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update user</DialogTitle>
              <DialogDescription>
                Edit name, email, status and primary role for this account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor={`name-${userId}`}>Full name</Label>
                <Input
                  id={`name-${userId}`}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`email-${userId}`}>Email</Label>
                <Input
                  id={`email-${userId}`}
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`status-${userId}`}>Status</Label>
                  <select
                    id={`status-${userId}`}
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {STATUSES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`role-${userId}`}>Role</Label>
                  <select
                    id={`role-${userId}`}
                    value={editRoleId}
                    onChange={(e) => setEditRoleId(e.target.value)}
                    className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-lg"
                disabled={pending || !editRoleId}
                onClick={() => {
                  startTransition(async () => {
                    const result = await updateUserAction({
                      userId,
                      name: editName,
                      email: editEmail,
                      status: editStatus,
                      roleId: editRoleId,
                    });
                    if (!result.ok) {
                      toast.error(result.error);
                      return;
                    }
                    toast.success("User updated");
                    setEditOpen(false);
                    router.refresh();
                  });
                }}
              >
                {pending ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={pending}
              className="h-8 rounded-md text-xs"
            >
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete user?</DialogTitle>
              <DialogDescription>
                This soft-deletes <strong>{name}</strong> ({email}). They will
                lose access immediately. You can invite the same email again
                later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="rounded-lg"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await deleteUserAction({ userId });
                    if (!result.ok) {
                      toast.error(result.error);
                      return;
                    }
                    toast.success("User deleted");
                    setDeleteOpen(false);
                    router.refresh();
                  });
                }}
              >
                {pending ? "Deleting…" : "Delete user"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        className="h-8 rounded-md text-xs"
        onClick={() => {
          startTransition(async () => {
            const result = await resendInviteAction({ userId });
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Invite email resent");
            router.refresh();
          });
        }}
      >
        Resend invite email
      </Button>
    </div>
  );
}
