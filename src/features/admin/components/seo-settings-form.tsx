"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { updateSeoSettingsAction } from "@/actions/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SETTING_META: Record<
  string,
  { label: string; hint: string; multiline?: boolean }
> = {
  seo_default_title: {
    label: "Default title",
    hint: "Used when a page has no custom title.",
  },
  seo_default_description: {
    label: "Default meta description",
    hint: "Fallback description for search results.",
    multiline: true,
  },
  seo_og_site_name: {
    label: "Open Graph site name",
    hint: "Shown when links are shared on social platforms.",
  },
  seo_canonical_base: {
    label: "Canonical base URL",
    hint: "e.g. https://www.prowinproperties.com",
  },
  meta_robots_default: {
    label: "Default robots",
    hint: "e.g. index,follow",
  },
};

function settingValueToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

type OrgFields = {
  id: string;
  name: string;
  domain: string | null;
  primaryColor: string | null;
  defaultCurrency: string;
};

type SettingRow = {
  id?: string;
  key: string;
  value: unknown;
};

export function SeoSettingsForm({
  organization,
  settings,
}: {
  organization: OrgFields;
  settings: SettingRow[];
}) {
  const router = useRouter();
  const [orgForm, setOrgForm] = useState({
    name: organization.name,
    domain: organization.domain ?? "",
    primaryColor: organization.primaryColor ?? "",
    defaultCurrency: organization.defaultCurrency,
  });
  const [settingValues, setSettingValues] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        settings.map((s) => [s.key, settingValueToString(s.value)]),
      ),
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const orderedKeys = [
    "seo_default_title",
    "seo_default_description",
    "seo_og_site_name",
    "seo_canonical_base",
    "meta_robots_default",
    ...settings.map((s) => s.key).filter((k) => !(k in SETTING_META)),
  ].filter((k, i, arr) => arr.indexOf(k) === i);

  return (
    <form
      className="space-y-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSaved(false);

        const result = await updateSeoSettingsAction({
          organizationId: organization.id,
          organization: {
            name: orgForm.name,
            domain: orgForm.domain || null,
            primaryColor: orgForm.primaryColor || null,
            defaultCurrency: orgForm.defaultCurrency,
          },
          settings: orderedKeys.map((key) => ({
            key,
            value: settingValues[key] ?? "",
          })),
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
      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Organization SEO</CardTitle>
          <CardDescription>
            Site identity used as defaults across public pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seo-site-name">Site name</Label>
              <Input
                id="seo-site-name"
                value={orgForm.name}
                onChange={(e) => {
                  setOrgForm((p) => ({ ...p, name: e.target.value }));
                  setSaved(false);
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo-domain">Domain</Label>
              <Input
                id="seo-domain"
                value={orgForm.domain}
                onChange={(e) => {
                  setOrgForm((p) => ({ ...p, domain: e.target.value }));
                  setSaved(false);
                }}
                placeholder="www.prowinproperties.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo-color">Primary color</Label>
              <Input
                id="seo-color"
                value={orgForm.primaryColor}
                onChange={(e) => {
                  setOrgForm((p) => ({ ...p, primaryColor: e.target.value }));
                  setSaved(false);
                }}
                placeholder="#A01919"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo-currency">Default currency</Label>
              <Input
                id="seo-currency"
                value={orgForm.defaultCurrency}
                onChange={(e) => {
                  setOrgForm((p) => ({
                    ...p,
                    defaultCurrency: e.target.value,
                  }));
                  setSaved(false);
                }}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Website settings</CardTitle>
          <CardDescription>
            Default SEO / meta values for the public site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {orderedKeys.map((key) => {
            const meta = SETTING_META[key] ?? {
              label: key,
              hint: "Custom website setting",
            };
            const value = settingValues[key] ?? "";
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={`seo-setting-${key}`}>{meta.label}</Label>
                {meta.multiline ? (
                  <Textarea
                    id={`seo-setting-${key}`}
                    value={value}
                    onChange={(e) => {
                      setSettingValues((p) => ({
                        ...p,
                        [key]: e.target.value,
                      }));
                      setSaved(false);
                    }}
                    rows={3}
                  />
                ) : (
                  <Input
                    id={`seo-setting-${key}`}
                    value={value}
                    onChange={(e) => {
                      setSettingValues((p) => ({
                        ...p,
                        [key]: e.target.value,
                      }));
                      setSaved(false);
                    }}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono">{key}</span>
                  {" — "}
                  {meta.hint}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? (
        <p className="text-sm text-[var(--success)]">SEO settings saved.</p>
      ) : null}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save SEO settings"}
      </Button>
    </form>
  );
}
