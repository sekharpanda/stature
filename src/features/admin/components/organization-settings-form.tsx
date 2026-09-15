"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { updateOrganizationAction } from "@/actions/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type OrgFields = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  defaultCurrency: string;
  timezone: string;
  primaryColor: string | null;
};

export function OrganizationSettingsForm({
  organization,
}: {
  organization: OrgFields;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: organization.name,
    phone: organization.phone ?? "",
    whatsapp: organization.whatsapp ?? "",
    email: organization.email ?? "",
    address: organization.address ?? "",
    city: organization.city ?? "",
    country: organization.country ?? "",
    defaultCurrency: organization.defaultCurrency,
    timezone: organization.timezone,
    primaryColor: organization.primaryColor ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  return (
    <Card className="card-elevated border-border/80">
      <CardHeader>
        <CardTitle className="font-display text-xl">Organization</CardTitle>
        <CardDescription>
          Workspace identity, contact details and regional defaults.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            const result = await updateOrganizationAction(organization.id, {
              name: form.name,
              phone: form.phone || null,
              whatsapp: form.whatsapp || null,
              email: form.email || null,
              address: form.address || null,
              city: form.city || null,
              country: form.country || null,
              defaultCurrency: form.defaultCurrency,
              timezone: form.timezone,
              primaryColor: form.primaryColor || null,
            });
            setLoading(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setSaved(true);
            router.refresh();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Name</Label>
              <Input
                id="org-name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-email">Email</Label>
              <Input
                id="org-email"
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-phone">Phone</Label>
              <Input
                id="org-phone"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-whatsapp">WhatsApp</Label>
              <Input
                id="org-whatsapp"
                value={form.whatsapp}
                onChange={(e) => setField("whatsapp", e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="org-address">Address</Label>
              <Input
                id="org-address"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-city">City</Label>
              <Input
                id="org-city"
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-country">Country</Label>
              <Input
                id="org-country"
                value={form.country}
                onChange={(e) => setField("country", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-currency">Default currency</Label>
              <Input
                id="org-currency"
                value={form.defaultCurrency}
                onChange={(e) => setField("defaultCurrency", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-timezone">Timezone</Label>
              <Input
                id="org-timezone"
                value={form.timezone}
                onChange={(e) => setField("timezone", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-color">Primary color</Label>
              <Input
                id="org-color"
                value={form.primaryColor}
                onChange={(e) => setField("primaryColor", e.target.value)}
                placeholder="#A01919"
              />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {saved ? (
            <p className="text-sm text-[var(--success)]">Settings saved.</p>
          ) : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
