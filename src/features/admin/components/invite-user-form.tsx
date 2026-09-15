"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { inviteUserAction } from "@/actions/users";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RoleOption = { id: string; name: string; slug: string };

export function InviteUserForm({
  organizationId,
  roles,
}: {
  organizationId: string;
  roles: RoleOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [status, setStatus] = useState<"INVITED" | "ACTIVE">("INVITED");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Card className="card-elevated border-border/80">
      <CardHeader>
        <CardTitle className="font-display text-xl">Invite teammate</CardTitle>
        <CardDescription>
          Creates the account and emails a secure temporary password with the
          admin login link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            const result = await inviteUserAction({
              organizationId,
              name,
              email,
              roleId,
              status,
            });
            setLoading(false);
            if (!result.ok) {
              setError(result.error);
              toast.error(result.error);
              return;
            }
            toast.success(`Invite email sent to ${email}`);
            setName("");
            setEmail("");
            router.refresh();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="invite-name">Full name</Label>
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sara Al Maktoum"
              required
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Work email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sara@prowinproperties.com"
              required
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">Primary role</Label>
            <select
              id="invite-role"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              required
              className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-status">Initial status</Label>
            <select
              id="invite-status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "INVITED" | "ACTIVE")
              }
              className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="INVITED">Invited</option>
              <option value="ACTIVE">Active now</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            A temporary password is generated server-side and emailed via
            Google Workspace (or Resend). SMTP must be set on the original
            domain before consultants can receive invites or reset links. Use
            “Resend invite email” on a user row if they need credentials
            again. Sales Agent invites open the consultant workspace.
          </p>
          {error ? (
            <p className="text-sm text-destructive sm:col-span-2">{error}</p>
          ) : null}
          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={loading || !roleId}
              className="rounded-lg"
            >
              {loading ? "Sending invite…" : "Send invite email"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
