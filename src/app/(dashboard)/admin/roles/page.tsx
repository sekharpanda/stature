import Link from "next/link";
import { Check, KeyRound, Shield, ShieldCheck, Users } from "lucide-react";

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
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  type PermissionKey,
  type RoleSlug,
} from "@/constants/permissions";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Roles",
  robots: { index: false, follow: false },
};

export default async function AdminRolesPage() {
  const org = await organizationRepository.getDefault();
  if (!org) {
    return <p className="text-muted-foreground">Organization not seeded.</p>;
  }

  const roles = await prisma.role.findMany({
    where: {
      deletedAt: null,
      OR: [{ organizationId: org.id }, { organizationId: null }],
    },
    include: {
      _count: {
        select: {
          rolePermissions: { where: { deletedAt: null } },
          userRoles: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  const systemRoleSlugs = Object.keys(ROLE_PERMISSIONS) as RoleSlug[];
  const permissionEntries = Object.entries(PERMISSIONS);
  const permissionGroups = permissionEntries.reduce<
    Record<string, Array<{ key: string; description?: string }>>
  >((acc, [key, meta]) => {
    const group = meta.group;
    if (!acc[group]) acc[group] = [];
    acc[group].push({ key, description: meta.description });
    return acc;
  }, {});

  const systemCount = roles.filter((r) => r.isSystem).length;
  const customCount = roles.length - systemCount;
  const totalPermissions = permissionEntries.length;
  const assignedUsers = roles.reduce((sum, r) => sum + r._count.userRoles, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Administration · IAM</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            Roles & permissions
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            System role catalog and permission matrix. Assign roles from the
            Users page.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-lg">
          <Link href="/admin/users">Manage users</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Roles"
          value={roles.length}
          icon={Shield}
          tone="primary"
        />
        <KpiCard
          label="System roles"
          value={systemCount}
          icon={ShieldCheck}
          tone="success"
          hint={`${customCount} organization-scoped`}
        />
        <KpiCard
          label="Permission keys"
          value={totalPermissions}
          icon={KeyRound}
          tone="default"
        />
        <KpiCard
          label="Role assignments"
          value={assignedUsers}
          icon={Users}
          tone="gold"
          href="/admin/users"
        />
      </div>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Role catalog</CardTitle>
          <CardDescription>
            Organization and system roles with live assignment and permission
            counts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No roles yet"
              description="Run seed to bootstrap system roles."
              className="py-12"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Permissions</th>
                    <th className="px-4 py-3 font-medium">Members</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{role.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {role.slug}
                        </p>
                        {role.description ? (
                          <p className="mt-1 max-w-md text-xs text-muted-foreground">
                            {role.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={role.isSystem ? "secondary" : "outline"}
                        >
                          {role.isSystem ? "System" : "Custom"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="tabular-nums">
                          {role._count.rolePermissions}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="tabular-nums">
                          {role._count.userRoles}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild variant="ghost" size="sm" className="rounded-lg">
                          <Link href={`/admin/users?role=${role.slug}`}>
                            View users
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            System permission matrix
          </CardTitle>
          <CardDescription>
            Reference grants from ROLE_PERMISSIONS. Checked cells are allowed for
            that system role.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(permissionGroups).map(([group, keys]) => (
            <div key={group} className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {group}
              </p>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="border-b bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">Permission</th>
                      {systemRoleSlugs.map((slug) => (
                        <th
                          key={slug}
                          className="px-3 py-2.5 text-center font-medium capitalize"
                        >
                          {slug.replace(/_/g, " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map(({ key, description }) => (
                      <tr key={key} className="border-b last:border-0">
                        <td className="px-3 py-2.5">
                          <p className="font-medium">{key}</p>
                          {description ? (
                            <p className="text-[11px] text-muted-foreground">
                              {description}
                            </p>
                          ) : null}
                        </td>
                        {systemRoleSlugs.map((slug) => {
                          const allowed = ROLE_PERMISSIONS[slug].includes(
                            key as PermissionKey,
                          );
                          return (
                            <td
                              key={`${slug}-${key}`}
                              className="px-3 py-2.5 text-center"
                            >
                              <span
                                className={cn(
                                  "inline-flex size-6 items-center justify-center rounded-md",
                                  allowed
                                    ? "bg-[var(--success)]/10 text-[var(--success)]"
                                    : "bg-muted/60 text-muted-foreground/40",
                                )}
                                aria-label={allowed ? "Allowed" : "Denied"}
                              >
                                {allowed ? (
                                  <Check className="size-3.5" strokeWidth={3} />
                                ) : (
                                  "—"
                                )}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
