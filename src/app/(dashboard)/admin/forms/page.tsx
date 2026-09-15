import Link from "next/link";
import { ClipboardList } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { CreateFormDefinition } from "@/features/admin/components/create-form-definition";
import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Forms",
  robots: { index: false, follow: false },
};

export default async function AdminFormsPage() {
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  const forms = await prisma.form.findMany({
    where: { organizationId: org.id, deletedAt: null },
    include: {
      _count: {
        select: {
          fields: { where: { deletedAt: null } },
          submissions: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">CMS</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Forms</h1>
        <p className="mt-2 text-muted-foreground">
          Build lead capture forms, manage fields, and review submissions.
        </p>
      </div>

      <CreateFormDefinition organizationId={org.id} />

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">All forms</CardTitle>
          <CardDescription>
            Active forms with field and submission counts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No forms yet"
              description="Create a form above to start capturing structured enquiries."
              className="py-12"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">Active</th>
                    <th className="px-4 py-3 font-medium">Fields</th>
                    <th className="px-4 py-3 font-medium">Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.map((form) => (
                    <tr key={form.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/admin/forms/${form.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {form.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {form.slug}
                      </td>
                      <td className="px-4 py-3">
                        {form.isActive ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-3">{form._count.fields}</td>
                      <td className="px-4 py-3">{form._count.submissions}</td>
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
