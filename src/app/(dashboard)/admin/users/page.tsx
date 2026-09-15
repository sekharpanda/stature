import Link from "next/link";
import {
  Search,
  Shield,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { KpiCard } from "@/features/admin/components/shared/kpi-card";
import { InviteUserForm } from "@/features/admin/components/invite-user-form";
import { UserRowControls } from "@/features/admin/components/user-row-controls";
import { organizationRepository } from "@/repositories/organization.repository";
import { userService } from "@/services/user.service";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Users",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const STATUS_FILTERS = [
  { key: undefined, label: "All", href: "/admin/users" },
  { key: "ACTIVE", label: "Active", href: "/admin/users?status=active" },
  { key: "INVITED", label: "Invited", href: "/admin/users?status=invited" },
  {
    key: "SUSPENDED",
    label: "Suspended",
    href: "/admin/users?status=suspended",
  },
  {
    key: "DISABLED",
    label: "Disabled",
    href: "/admin/users?status=disabled",
  },
] as const;

function mapStatusParam(raw?: string) {
  const value = raw?.toLowerCase();
  switch (value) {
    case "active":
      return "ACTIVE" as const;
    case "invited":
      return "INVITED" as const;
    case "suspended":
      return "SUSPENDED" as const;
    case "disabled":
      return "DISABLED" as const;
    default:
      return undefined;
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "border-transparent bg-[var(--success)]/10 text-[var(--success)]";
    case "INVITED":
      return "border-transparent bg-primary/10 text-primary";
    case "SUSPENDED":
      return "border-transparent bg-[var(--warning)]/10 text-[var(--warning)]";
    case "DISABLED":
      return "border-transparent bg-destructive/10 text-destructive";
    default:
      return "";
  }
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const status = mapStatusParam(first(sp.status));
  const roleSlug = first(sp.role)?.trim() || undefined;
  const q = first(sp.q)?.trim() || undefined;

  const org = await organizationRepository.getDefault();
  if (!org) {
    return <p className="text-muted-foreground">Organization not seeded.</p>;
  }

  const [users, counts, roles] = await Promise.all([
    userService.list(org.id, { status, roleSlug, q }),
    userService.dashboard(org.id),
    userService.listRoles(org.id),
  ]);

  const title =
    STATUS_FILTERS.find((item) => item.key === status)?.label ?? "All users";

  const withQuery = (href: string) => {
    const params = new URLSearchParams();
    if (href.includes("?")) {
      const existing = new URL(href, "http://local").searchParams;
      existing.forEach((v, k) => params.set(k, v));
    }
    if (q) params.set("q", q);
    if (roleSlug && !params.has("status")) {
      /* keep role filter when browsing status chips only via status href */
    }
    if (roleSlug) params.set("role", roleSlug);
    const qs = params.toString();
    const base = href.split("?")[0];
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Administration · IAM</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Users</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Team members, invites, status controls and role assignment for{" "}
            {org.name}.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-lg">
          <Link href="/admin/roles">Roles & permissions</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total users"
          value={counts.total}
          icon={Users}
          tone="primary"
          href="/admin/users"
        />
        <KpiCard
          label="Active"
          value={counts.active}
          icon={UserCheck}
          tone="success"
          href="/admin/users?status=active"
        />
        <KpiCard
          label="Invited"
          value={counts.invited}
          icon={UserPlus}
          tone="default"
          href="/admin/users?status=invited"
        />
        <KpiCard
          label="Suspended / disabled"
          value={counts.suspended + counts.disabled}
          icon={UserX}
          tone="warning"
          href="/admin/users?status=suspended"
        />
      </div>

      <InviteUserForm
        organizationId={org.id}
        roles={roles.map((r) => ({ id: r.id, name: r.name, slug: r.slug }))}
      />

      <Card className="card-elevated border-border/80">
        <CardHeader className="gap-4 space-y-0 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-display text-xl">{title}</CardTitle>
            <CardDescription>
              {users.length.toLocaleString()} account
              {users.length === 1 ? "" : "s"} in this view
              {roleSlug ? ` · role “${roleSlug}”` : ""}
            </CardDescription>
          </div>
          <form className="flex gap-2" action="/admin/users">
            {status ? (
              <input
                type="hidden"
                name="status"
                value={first(sp.status) ?? ""}
              />
            ) : null}
            {roleSlug ? (
              <input type="hidden" name="role" value={roleSlug} />
            ) : null}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search name or email…"
                className="h-9 w-64 rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" variant="secondary" className="rounded-lg">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((chip) => (
              <Link
                key={chip.label}
                href={withQuery(chip.href)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  chip.key === status
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {chip.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={
                status
                  ? `/admin/users?status=${first(sp.status)}${q ? `&q=${encodeURIComponent(q)}` : ""}`
                  : q
                    ? `/admin/users?q=${encodeURIComponent(q)}`
                    : "/admin/users"
              }
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                !roleSlug
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              Any role
            </Link>
            {roles.map((role) => {
              const params = new URLSearchParams();
              if (status) params.set("status", first(sp.status) ?? "");
              params.set("role", role.slug);
              if (q) params.set("q", q);
              return (
                <Link
                  key={role.id}
                  href={`/admin/users?${params.toString()}`}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    roleSlug === role.slug
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {role.name}
                </Link>
              );
            })}
          </div>

          {users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users in this view"
              description="Invite a teammate or clear filters to see organization accounts."
              className="py-12"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Roles</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground">
                            {(user.name || user.email)
                              .split(/\s+/)
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join("")}
                          </span>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                            {!user.emailVerified ? (
                              <p className="mt-1 text-[11px] text-[var(--warning)]">
                                Email not verified
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={statusBadgeClass(user.status)}
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {user.userRoles.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {user.userRoles.map((ur) => (
                              <Badge
                                key={ur.id}
                                variant="secondary"
                                className="gap-1"
                              >
                                <Shield className="size-3" />
                                {ur.role.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <UserRowControls
                          userId={user.id}
                          name={user.name}
                          email={user.email}
                          status={user.status}
                          roleIds={user.userRoles.map((ur) => ur.roleId)}
                          roles={roles.map((r) => ({
                            id: r.id,
                            name: r.name,
                          }))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
