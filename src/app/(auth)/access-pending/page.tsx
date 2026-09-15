import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession, getUserRoleSlugs } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SignOutButton } from "@/features/portal/components/sign-out-button";

export const metadata = {
  title: "Access Pending",
  robots: { index: false, follow: false },
};

export default async function AccessPendingPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const roleSlugs = await getUserRoleSlugs(session.user.id);
  if (roleSlugs.length > 0) redirect("/admin");

  const request = await prisma.contentSubmission.findFirst({
    where: {
      submittedById: session.user.id,
      entityType: "AGENT_ACCOUNT",
      deletedAt: null,
    },
    orderBy: { submittedAt: "desc" },
    select: { status: true, submittedAt: true, reviewNote: true },
  });

  const rejected = request?.status === "REJECTED";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <Card className="card-elevated w-full max-w-lg border-border/80 shadow-none">
        <CardHeader>
          <span
            className={
              rejected
                ? "flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                : "flex size-11 items-center justify-center rounded-full bg-amber-100 text-amber-900"
            }
          >
            {rejected ? (
              <ShieldX className="size-5" />
            ) : (
              <Clock className="size-5" />
            )}
          </span>
          <CardTitle className="mt-3 font-display text-2xl">
            {rejected ? "Access was not approved" : "Waiting for approval"}
          </CardTitle>
          <CardDescription>
            {rejected
              ? "A superadmin reviewed your request and did not approve it."
              : request
                ? `Your request was sent on ${request.submittedAt.toLocaleDateString()}. You will be able to sign in to the portal as soon as a superadmin approves it.`
                : "This login is not connected to a consultant profile yet. Ask an administrator to link it in Admin → Agents."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {request?.reviewNote ? (
            <p className="rounded-md bg-muted px-3 py-2 text-sm">
              <span className="font-medium">Note:</span> {request.reviewNote}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            Signed in as {session.user.email}.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/">Back to website</Link>
            </Button>
            <SignOutButton />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
