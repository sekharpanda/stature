import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AgentEditor } from "@/features/admin/components/agents/agent-editor";
import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Add agent",
  robots: { index: false, follow: false },
};

export default async function AdminNewAgentPage() {
  const org = await organizationRepository.getDefault();
  if (!org) {
    return <p className="text-muted-foreground">Organization not seeded.</p>;
  }

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      OR: [{ organizationId: org.id }, { organizationId: null }],
    },
    orderBy: { name: "asc" },
    take: 200,
    select: { id: true, name: true, email: true },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Team</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Add agent</h1>
          <p className="mt-2 text-muted-foreground">
            Create a consultant profile for the website, property sidebars and
            lead routing.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/agents">All agents</Link>
        </Button>
      </div>
      <AgentEditor organizationId={org.id} mode="create" users={users} />
    </div>
  );
}
