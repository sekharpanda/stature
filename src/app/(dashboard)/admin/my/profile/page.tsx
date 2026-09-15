import Link from "next/link";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "@/features/portal/components/profile-form";
import { WithdrawButton } from "@/features/portal/components/withdraw-button";
import { portalService } from "@/services/portal.service";
import type { FieldChange } from "@/services/submission.service";

export const metadata = {
  title: "My Profile",
  robots: { index: false, follow: false },
};

export default async function PortalProfilePage() {
  const { context, agent, values, pending, pendingChanges } =
    await portalService.profileView();
  const changes = pendingChanges as FieldChange[];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Agent portal</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">My profile</h1>
          <p className="mt-2 text-muted-foreground">
            This is what buyers see on your public page. Changes go live once a
            superadmin approves them.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/our-team/${agent.slug}`} target="_blank">
            View my public page
          </Link>
        </Button>
      </div>

      {!agent.isActive ? (
        <Card className="border-amber-300 bg-amber-50/60 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Your profile is not on the website yet
            </CardTitle>
            <CardDescription>
              You can fill everything in now. The office decides when your card
              appears on the team page.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {pending ? (
        <Card className="border-amber-300 bg-amber-50/60 dark:bg-amber-950/20">
          <CardHeader className="gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Clock className="size-4" />
                  {changes.length} change{changes.length === 1 ? "" : "s"} waiting
                  for approval
                </CardTitle>
                <CardDescription>
                  Submitted {pending.submittedAt.toLocaleString()}. Your live
                  profile is unchanged until then.
                </CardDescription>
              </div>
              <WithdrawButton submissionId={pending.id} />
            </div>
          </CardHeader>
          {changes.length > 0 ? (
            <CardContent>
              <ul className="space-y-1.5 text-sm">
                {changes.map((change) => (
                  <li key={change.field} className="flex flex-wrap gap-x-2">
                    <span className="font-medium">{change.label}:</span>
                    <span className="text-muted-foreground line-through">
                      {change.from ?? "empty"}
                    </span>
                    <span aria-hidden>→</span>
                    <span>{change.to ?? "empty"}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      <ProfileForm
        values={{
          title: values.title,
          email: values.email,
          phone: values.phone,
          whatsapp: values.whatsapp,
          bio: values.bio,
          photoUrl: values.photoUrl,
          photoMediaId: values.photoMediaId,
          languages: values.languages,
          specialties: values.specialties,
          serviceAreas: values.serviceAreas,
          reraNumber: values.reraNumber,
          yearsExperience: values.yearsExperience,
        }}
        hasPending={Boolean(pending)}
      />

      <p className="text-xs text-muted-foreground">
        Signed in as {context.userEmail}.
      </p>
    </div>
  );
}
