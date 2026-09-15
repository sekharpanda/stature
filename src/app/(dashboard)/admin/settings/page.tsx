import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrganizationSettingsForm } from "@/features/admin/components/organization-settings-form";
import { getHostingReadiness } from "@/lib/hosting-readiness";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const org = await organizationRepository.getDefault();

  const leadratEnabled = process.env.LEADRAT_ENABLED === "true";
  const leadratOffplanEnabled = process.env.LEADRAT_OFFPLAN_ENABLED === "true";
  const hosting = getHostingReadiness();

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">System</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">
          Website settings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Branding, integrations and workspace defaults.
        </p>
      </div>

      {org ? (
        <OrganizationSettingsForm
          organization={{
            id: org.id,
            name: org.name,
            phone: org.phone,
            whatsapp: org.whatsapp,
            email: org.email,
            address: org.address,
            city: org.city,
            country: org.country,
            defaultCurrency: org.defaultCurrency,
            timezone: org.timezone,
            primaryColor: org.primaryColor,
          }}
        />
      ) : (
        <p className="text-muted-foreground">Organization not seeded.</p>
      )}

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            Original site readiness
          </CardTitle>
          <CardDescription>
            Invite, forgot-password and new photo uploads wait on these env
            flags. Set them on the Vercel project that will serve{" "}
            {hosting.canonical}. Values are never shown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground">App URL</dt>
              <dd className="mt-1 font-medium break-all">{hosting.appUrl}</dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground">Auth URL</dt>
              <dd className="mt-1 font-medium break-all">{hosting.authUrl}</dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground">On original domain</dt>
              <dd className="mt-1 font-medium">
                {hosting.onCanonical ? "Yes" : "Not yet — still a preview host"}
              </dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground">Invite / reset email</dt>
              <dd className="mt-1 font-medium">
                {hosting.emailConfigured
                  ? "Configured"
                  : "Not configured — set SMTP_USER + SMTP_PASS"}
              </dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground">Photo uploads</dt>
              <dd className="mt-1 font-medium">
                {hosting.blobConfigured
                  ? "Vercel Blob ready"
                  : "Connect a Vercel Blob store"}
              </dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground">Google reviews / maps</dt>
              <dd className="mt-1 font-medium">
                {hosting.maps && hosting.placeId
                  ? "Configured"
                  : "Maps or Place ID missing"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">LeadRat status</CardTitle>
          <CardDescription>
            Read-only environment flags — configure via deployment env.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground">LEADRAT_ENABLED</dt>
              <dd className="mt-1 font-medium">
                {leadratEnabled ? "Enabled" : "Disabled"}
              </dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground">LEADRAT_OFFPLAN_ENABLED</dt>
              <dd className="mt-1 font-medium">
                {leadratOffplanEnabled ? "Enabled" : "Disabled"}
              </dd>
            </div>
            {org ? (
              <div className="rounded-lg border p-3 sm:col-span-2">
                <dt className="text-muted-foreground">Organization slug</dt>
                <dd className="mt-1 font-medium">{org.slug}</dd>
              </div>
            ) : null}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
