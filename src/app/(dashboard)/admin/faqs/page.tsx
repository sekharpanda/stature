import { CircleQuestionMark } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { CreateFaqForm } from "@/features/admin/components/create-faq-form";
import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "FAQs",
  robots: { index: false, follow: false },
};

export default async function AdminFaqsPage() {
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  const faqs = await prisma.faq.findMany({
    where: { organizationId: org.id, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">CMS</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">FAQs</h1>
        <p className="mt-2 text-muted-foreground">
          FAQ bank with schema markup support.
        </p>
      </div>

      <CreateFaqForm organizationId={org.id} />

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">All FAQs</CardTitle>
          <CardDescription>General and entity-linked questions.</CardDescription>
        </CardHeader>
        <CardContent>
          {faqs.length === 0 ? (
            <EmptyState
              icon={CircleQuestionMark}
              title="No FAQs yet"
              description="Create a question and answer above."
              className="py-12"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Question</th>
                    <th className="px-4 py-3 font-medium">Answer</th>
                  </tr>
                </thead>
                <tbody>
                  {faqs.map((faq) => (
                    <tr key={faq.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium align-top">
                        {faq.question}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {faq.answer.length > 160
                          ? `${faq.answer.slice(0, 160)}…`
                          : faq.answer}
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
