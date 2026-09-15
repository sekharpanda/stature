import { Suspense } from "react";
import { redirect } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/features/admin/components/shell/app-sidebar";
import { AdminTopbar } from "@/features/admin/components/shell/admin-topbar";
import { getSession, getUserPermissionKeys, getUserRoleSlugs } from "@/lib/auth";
import { agentRepository } from "@/repositories/agent.repository";
import { organizationRepository } from "@/repositories/organization.repository";
import { notificationRepository } from "@/repositories/notification.repository";
import {
  getDashboardMetrics,
  metricsToNavBadges,
} from "@/services/dashboard.service";
import { propertySyncService } from "@/services/property-sync.service";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/admin");
  }

  const organizationId =
    (session.user as { organizationId?: string | null }).organizationId ??
    (await organizationRepository.getDefault())?.id;

  if (!organizationId) {
    redirect("/login?next=/admin");
  }

  // Non-blocking: pull LeadRat projects when inventory is stale
  propertySyncService.scheduleAutoSync(organizationId);

  // Keep concurrency low — Neon free-tier pooler + Prisma client pool starve
  // when layout + dashboard page open ~30 queries at once.
  const [permissions, roleSlugs] = await Promise.all([
    getUserPermissionKeys(session.user.id),
    getUserRoleSlugs(session.user.id),
  ]);

  // A self-registered agent has an account but no role until a superadmin
  // approves them, so they must not reach the shell at all.
  if (roleSlugs.length === 0) {
    redirect("/access-pending");
  }

  // Staff whose permission join is briefly empty (fresh seed) still need a
  // usable shell; portal-only roles never get this fallback.
  const isStaff = roleSlugs.some((slug) =>
    ["super_admin", "admin", "property_manager", "content_editor"].includes(slug),
  );
  const effectivePermissions =
    permissions.length > 0
      ? permissions
      : isStaff
        ? [
            "dashboard:view",
            "property:read",
            "developer:manage",
            "location:manage",
            "amenity:manage",
            "lead:read",
            "media:read",
            "cms:homepage",
            "cms:landing",
            "cms:blog",
            "cms:form",
            "cms:seo",
            "cms:page",
            "user:manage",
            "role:manage",
            "settings:manage",
            "analytics:view",
            "activity:view",
          ]
        : [];

  if (effectivePermissions.length === 0) {
    redirect("/access-pending");
  }

  const hasAgentProfile =
    effectivePermissions.includes("portal:access") &&
    Boolean(await agentRepository.findByUserId(session.user.id));

  // Portal users see only what is addressed to them, and none of the
  // company-wide counters.
  const metrics = isStaff ? await getDashboardMetrics(organizationId) : null;
  const [notifications, unreadCount] = isStaff
    ? await Promise.all([
        notificationRepository.listRecent(organizationId, 12),
        notificationRepository.countUnread(organizationId),
      ])
    : await Promise.all([
        notificationRepository.listRecentForUser(session.user.id, 12),
        notificationRepository.countUnreadForUser(session.user.id),
      ]);

  return (
    <SidebarProvider defaultOpen>
      <Suspense fallback={<div className="w-(--sidebar-width) shrink-0 border-r" />}>
        <AppSidebar
          badges={metrics ? metricsToNavBadges(metrics) : {}}
          permissions={effectivePermissions}
          showPortal={hasAgentProfile}
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
        />
      </Suspense>
      <SidebarInset className="min-w-0 bg-background">
        <AdminTopbar
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
          notifications={notifications.map((item) => ({
            id: item.id,
            type: item.type,
            title: item.title,
            body: item.body,
            href: item.href,
            isRead: item.isRead,
            createdAt: item.createdAt.toISOString(),
          }))}
          unreadCount={unreadCount}
        />
        <div className="flex-1 px-4 py-6 lg:px-6 lg:py-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
