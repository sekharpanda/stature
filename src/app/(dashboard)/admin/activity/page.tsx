import { Activity } from "lucide-react";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Activity",
  robots: { index: false, follow: false },
};

export default async function AdminActivityPage() {
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  const logs = await prisma.activityLog.findMany({
    where: { organizationId: org.id, deletedAt: null },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">System</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Activity</h1>
        <p className="mt-2 text-muted-foreground">
          Recent workspace actions across inventory, CRM and CMS.
        </p>
      </div>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Activity log</CardTitle>
          <CardDescription>Latest 100 events for this organization.</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Actions will appear here as the team uses the admin."
              className="py-12"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Entity</th>
                    <th className="px-4 py-3 font-medium">User</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {format(log.createdAt, "dd MMM yyyy HH:mm")}
                      </td>
                      <td className="px-4 py-3 font-medium">{log.action}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.entityType ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.user?.name ?? log.user?.email ?? "System"}
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
