import Link from "next/link";
import { notFound } from "next/navigation";
import { Inbox } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { FormFieldEditor } from "@/features/admin/components/form-field-editor";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Form detail",
  robots: { index: false, follow: false },
};

type Params = Promise<{ id: string }>;

export default async function AdminFormDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const form = await prisma.form.findFirst({
    where: { id, deletedAt: null },
    include: {
      fields: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
      },
      submissions: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!form) notFound();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/admin/forms" className="hover:underline">
            Forms
          </Link>{" "}
          / {form.name}
        </p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">{form.name}</h1>
        <p className="mt-2 text-muted-foreground">
          Slug <code className="text-xs">{form.slug}</code>
          {form.description ? ` · ${form.description}` : null}
        </p>
      </div>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Fields</CardTitle>
          <CardDescription>
            Field builder for this form. Required phone fields create a Lead on
            submit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormFieldEditor
            formId={form.id}
            isActive={form.isActive}
            fields={form.fields.map((f) => ({
              id: f.id,
              name: f.name,
              label: f.label,
              type: f.type,
              isRequired: f.isRequired,
            }))}
          />
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Submissions</CardTitle>
          <CardDescription>Latest 50 responses for this form.</CardDescription>
        </CardHeader>
        <CardContent>
          {form.submissions.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No submissions yet"
              description="Responses will appear here when the form is submitted."
              className="py-12"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Payload</th>
                    <th className="px-4 py-3 font-medium">Lead</th>
                  </tr>
                </thead>
                <tbody>
                  {form.submissions.map((row) => {
                    const payload =
                      row.payload && typeof row.payload === "object"
                        ? (row.payload as Record<string, unknown>)
                        : {};
                    const summary = Object.entries(payload)
                      .slice(0, 4)
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join(" · ");
                    return (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {row.createdAt.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">{summary || "—"}</td>
                        <td className="px-4 py-3">
                          {row.leadId ? (
                            <Link
                              href={`/admin/leads/${row.leadId}`}
                              className="text-primary hover:underline"
                            >
                              View lead
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
