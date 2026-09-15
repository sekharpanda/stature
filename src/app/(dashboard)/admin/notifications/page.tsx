import { Bell } from "lucide-react";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { MarkAllNotificationsReadButton } from "@/features/admin/components/mark-all-notifications-read-button";
import { notificationRepository } from "@/repositories/notification.repository";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default async function AdminNotificationsPage() {
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  const [notifications, unread] = await Promise.all([
    notificationRepository.list(org.id, 100),
    notificationRepository.countUnread(org.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">System</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            Notifications
          </h1>
          <p className="mt-2 text-muted-foreground">
            {unread} unread · operational alerts for leads, sync and publish.
          </p>
        </div>
        <MarkAllNotificationsReadButton />
      </div>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Inbox</CardTitle>
          <CardDescription>Latest 100 notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="You're all caught up."
              className="py-12"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n) => (
                    <tr key={n.id} className="border-b last:border-0">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {format(n.createdAt, "dd MMM yyyy HH:mm")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{n.type}</td>
                      <td className="px-4 py-3 font-medium">{n.title}</td>
                      <td className="px-4 py-3">
                        {n.isRead ? "Read" : "Unread"}
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
