"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { createAgentAction, updateAgentAction } from "@/actions/agents";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/features/admin/components/shared/image-upload-field";
import { slugify } from "@/lib/utils";

export type AgentFormValues = {
  name: string;
  slug: string;
  title: string;
  email: string;
  phone: string;
  whatsapp: string;
  bio: string;
  photoUrl: string;
  photoMediaId: string | null;
  specialties: string;
  languages: string;
  serviceAreas: string;
  reraNumber: string;
  yearsExperience: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: string;
  metaTitle: string;
  metaDescription: string;
  userId: string;
};

export type AgentUserOption = {
  id: string;
  name: string | null;
  email: string;
};

export const EMPTY_AGENT_FORM: AgentFormValues = {
  name: "",
  slug: "",
  title: "Property Consultant",
  email: "",
  phone: "",
  whatsapp: "",
  bio: "",
  photoUrl: "",
  photoMediaId: null,
  specialties: "",
  languages: "",
  serviceAreas: "",
  reraNumber: "",
  yearsExperience: "",
  isActive: true,
  isFeatured: false,
  sortOrder: "0",
  metaTitle: "",
  metaDescription: "",
  userId: "",
};

export function AgentEditor({
  organizationId,
  mode,
  agentId,
  initial,
  users = [],
}: {
  organizationId: string;
  mode: "create" | "edit";
  agentId?: string;
  initial?: AgentFormValues;
  users?: AgentUserOption[];
}) {
  const router = useRouter();
  const baseline = useMemo(() => initial ?? EMPTY_AGENT_FORM, [initial]);
  const [values, setValues] = useState<AgentFormValues>(baseline);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(baseline),
    [values, baseline],
  );

  function set<K extends keyof AgentFormValues>(
    key: K,
    value: AgentFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const slugPreview = values.slug || slugify(values.name) || "agent-slug";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: values.name.trim(),
      slug: values.slug ? slugify(values.slug) : undefined,
      title: values.title,
      email: values.email,
      phone: values.phone,
      whatsapp: values.whatsapp,
      bio: values.bio,
      photoUrl: values.photoUrl,
      photoMediaId: values.photoMediaId,
      specialties: values.specialties,
      languages: values.languages,
      serviceAreas: values.serviceAreas,
      reraNumber: values.reraNumber,
      yearsExperience: values.yearsExperience
        ? Number(values.yearsExperience)
        : null,
      isActive: values.isActive,
      isFeatured: values.isFeatured,
      sortOrder: values.sortOrder ? Number(values.sortOrder) : 0,
      metaTitle: values.metaTitle,
      metaDescription: values.metaDescription,
      userId: values.userId || null,
    };

    const result =
      mode === "create"
        ? await createAgentAction({ organizationId, ...payload })
        : await updateAgentAction({ id: agentId, ...payload });

    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    if (mode === "create") {
      toast.success("Agent profile created");
      router.push(`/admin/agents/${result.data.id}`);
      return;
    }

    toast.success("Agent profile saved");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            Identity &amp; contact
          </CardTitle>
          <CardDescription>
            Shown on property sidebars, the homepage team strip and /our-team.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="agent-name">Full name</Label>
            <Input
              id="agent-name"
              value={values.name}
              onChange={(event) => set("name", event.target.value)}
              required
              minLength={2}
              placeholder="Aisha Khan"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-title">Title / role</Label>
            <Input
              id="agent-title"
              value={values.title}
              onChange={(event) => set("title", event.target.value)}
              placeholder="Senior Property Consultant"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-slug">Profile slug</Label>
            <Input
              id="agent-slug"
              value={values.slug}
              onChange={(event) => set("slug", event.target.value)}
              placeholder={slugify(values.name) || "aisha-khan"}
            />
            <p className="text-xs text-muted-foreground">
              /our-team/{slugPreview}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-rera">RERA / BRN number</Label>
            <Input
              id="agent-rera"
              value={values.reraNumber}
              onChange={(event) => set("reraNumber", event.target.value)}
              placeholder="BRN-XXXXX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-email">Email</Label>
            <Input
              id="agent-email"
              type="email"
              value={values.email}
              onChange={(event) => set("email", event.target.value)}
              placeholder="aisha@prowinproperties.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-phone">Phone</Label>
            <Input
              id="agent-phone"
              value={values.phone}
              onChange={(event) => set("phone", event.target.value)}
              placeholder="+971 50 000 0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-whatsapp">WhatsApp</Label>
            <Input
              id="agent-whatsapp"
              value={values.whatsapp}
              onChange={(event) => set("whatsapp", event.target.value)}
              placeholder="+971500000000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-user">Linked login</Label>
            <select
              id="agent-user"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={values.userId}
              onChange={(event) => set("userId", event.target.value)}
            >
              <option value="">— Not linked —</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Links this profile to a CRM user for lead routing.
            </p>
          </div>
          <div className="md:col-span-2">
            <ImageUploadField
              label="Profile photo"
              description="Square images work best — 800×800 or larger."
              shape="circle"
              value={{ url: values.photoUrl, mediaId: values.photoMediaId }}
              onChange={(next) =>
                setValues((prev) => ({
                  ...prev,
                  photoUrl: next.url,
                  photoMediaId: next.mediaId,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            Expertise &amp; bio
          </CardTitle>
          <CardDescription>
            Comma-separated lists render as tags on the public profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="agent-specialties">Specialties</Label>
            <Input
              id="agent-specialties"
              value={values.specialties}
              onChange={(event) => set("specialties", event.target.value)}
              placeholder="Off-plan, Investment, Luxury villas"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-languages">Languages</Label>
            <Input
              id="agent-languages"
              value={values.languages}
              onChange={(event) => set("languages", event.target.value)}
              placeholder="English, Arabic, Hindi"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-areas">Service areas</Label>
            <Input
              id="agent-areas"
              value={values.serviceAreas}
              onChange={(event) => set("serviceAreas", event.target.value)}
              placeholder="Business Bay, Downtown, Dubai Marina"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-years">Years of experience</Label>
            <Input
              id="agent-years"
              type="number"
              min={0}
              max={60}
              value={values.yearsExperience}
              onChange={(event) => set("yearsExperience", event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="agent-bio">Bio</Label>
            <Textarea
              id="agent-bio"
              rows={5}
              value={values.bio}
              onChange={(event) => set("bio", event.target.value)}
              placeholder="Helps investors and end-users find the right Dubai home…"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="card-elevated border-border/80">
          <CardHeader>
            <CardTitle className="font-display text-xl">Visibility</CardTitle>
            <CardDescription>
              Controls where this consultant appears publicly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-start justify-between gap-4 rounded-lg border px-3 py-3">
              <span>
                <span className="block text-sm font-medium">Active</span>
                <span className="block text-xs text-muted-foreground">
                  Inactive agents are hidden from the website and assignment
                  lists.
                </span>
              </span>
              <Switch
                checked={values.isActive}
                onCheckedChange={(checked) => set("isActive", checked)}
              />
            </label>
            <label className="flex items-start justify-between gap-4 rounded-lg border px-3 py-3">
              <span>
                <span className="block text-sm font-medium">Featured</span>
                <span className="block text-xs text-muted-foreground">
                  Featured agents lead the homepage and team roster.
                </span>
              </span>
              <Switch
                checked={values.isFeatured}
                onCheckedChange={(checked) => set("isFeatured", checked)}
              />
            </label>
            <div className="space-y-2">
              <Label htmlFor="agent-sort">Display order</Label>
              <Input
                id="agent-sort"
                type="number"
                min={0}
                max={9999}
                value={values.sortOrder}
                onChange={(event) => set("sortOrder", event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first. Drag-free ordering is also available
                on the agents list.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated border-border/80">
          <CardHeader>
            <CardTitle className="font-display text-xl">Search &amp; SEO</CardTitle>
            <CardDescription>
              Used when this consultant is indexed or shared.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent-meta-title">Meta title</Label>
              <Input
                id="agent-meta-title"
                maxLength={70}
                value={values.metaTitle}
                onChange={(event) => set("metaTitle", event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {values.metaTitle.length}/70
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-meta-desc">Meta description</Label>
              <Textarea
                id="agent-meta-desc"
                rows={3}
                maxLength={180}
                value={values.metaDescription}
                onChange={(event) => set("metaDescription", event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {values.metaDescription.length}/180
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-sm backdrop-blur">
        <p className="text-sm text-muted-foreground">
          {mode === "create"
            ? "The profile goes live as soon as it is active."
            : dirty
              ? "Unsaved changes"
              : "All changes saved"}
        </p>
        <div className="flex gap-2">
          {mode === "edit" ? (
            <Button
              type="button"
              variant="ghost"
              disabled={!dirty || saving}
              onClick={() => setValues(baseline)}
            >
              <RotateCcw className="mr-1.5 size-3.5" />
              Discard
            </Button>
          ) : null}
          <Button type="submit" disabled={saving || (mode === "edit" && !dirty)}>
            {saving ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
            {mode === "create" ? "Create agent" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
