import { MessageSquareQuote } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { CreateTestimonialForm } from "@/features/admin/components/create-testimonial-form";
import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Testimonials",
  robots: { index: false, follow: false },
};

export default async function AdminTestimonialsPage() {
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  const testimonials = await prisma.testimonial.findMany({
    where: { organizationId: org.id, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">CMS</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Testimonials</h1>
        <p className="mt-2 text-muted-foreground">
          Client quotes for homepage and campaign social proof.
        </p>
      </div>

      <CreateTestimonialForm organizationId={org.id} />

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">All testimonials</CardTitle>
          <CardDescription>
            Author, role and quote body from the Testimonial model.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testimonials.length === 0 ? (
            <EmptyState
              icon={MessageSquareQuote}
              title="No testimonials yet"
              description="Add a client quote above."
              className="py-12"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Quote</th>
                    <th className="px-4 py-3 font-medium">Featured</th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{t.authorName}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.authorRole ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.content.length > 120
                          ? `${t.content.slice(0, 120)}…`
                          : t.content}
                      </td>
                      <td className="px-4 py-3">
                        {t.isFeatured ? "Yes" : "No"}
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
