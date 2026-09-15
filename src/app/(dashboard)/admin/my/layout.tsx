import { redirect } from "next/navigation";

import { getSession, getUserPermissionKeys } from "@/lib/auth";
import { getPortalContext } from "@/services/portal.service";

/**
 * The portal belongs to consultants with a linked profile. Staff who wander in
 * go back to the dashboard; everyone else waits for approval.
 */
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getPortalContext();
  if (context) return <>{children}</>;

  const session = await getSession();
  if (!session?.user?.id) redirect("/login?next=/admin/my");

  const permissions = await getUserPermissionKeys(session.user.id);
  redirect(permissions.includes("dashboard:view") ? "/admin" : "/access-pending");
}
