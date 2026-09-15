"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import { submitProfileChangesAction } from "@/actions/portal";
import { ImageUploadField } from "@/features/portal/components/image-upload-field";

export type ProfileFormValues = {
  title: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  bio: string | null;
  photoUrl: string | null;
  photoMediaId: string | null;
  languages: string[];
  specialties: string[];
  serviceAreas: string[];
  reraNumber: string | null;
  yearsExperience: number | null;
};

export function ProfileForm({
  values,
  hasPending,
}: {
  values: ProfileFormValues;
  hasPending: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: values.title ?? "",
    email: values.email ?? "",
    phone: values.phone ?? "",
    whatsapp: values.whatsapp ?? "",
    bio: values.bio ?? "",
    reraNumber: values.reraNumber ?? "",
    yearsExperience:
      values.yearsExperience == null ? "" : String(values.yearsExperience),
    languages: values.languages.join(", "),
    specialties: values.specialties.join(", "),
    serviceAreas: values.serviceAreas.join(", "),
    note: "",
  });
  const [photo, setPhoto] = useState<string[]>(
    values.photoUrl ? [values.photoUrl] : [],
  );

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitProfileChangesAction({
        ...form,
        photoUrl: photo[0] ?? null,
        photoMediaId: values.photoMediaId,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Sent for approval", {
        description: "Your profile stays as it is until a superadmin approves.",
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Your details</CardTitle>
          <CardDescription>
            Your name, profile link and roster position are managed by the office.
            Everything here is yours to update.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Role</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => set("title", event.target.value)}
              placeholder="Property Consultant"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reraNumber">RERA / BRN number</Label>
            <Input
              id="reraNumber"
              value={form.reraNumber}
              onChange={(event) => set("reraNumber", event.target.value)}
              placeholder="12345"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(event) => set("phone", event.target.value)}
              placeholder="+971 50 000 0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={form.whatsapp}
              onChange={(event) => set("whatsapp", event.target.value)}
              placeholder="+971 50 000 0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => set("email", event.target.value)}
              placeholder="you@prowinproperties.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearsExperience">Years of experience</Label>
            <Input
              id="yearsExperience"
              type="number"
              min={0}
              max={60}
              value={form.yearsExperience}
              onChange={(event) => set("yearsExperience", event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bio">About you</Label>
            <Textarea
              id="bio"
              rows={5}
              value={form.bio}
              onChange={(event) => set("bio", event.target.value)}
              placeholder="A short introduction buyers will read on your profile page."
            />
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            Photo and expertise
          </CardTitle>
          <CardDescription>
            Separate multiple entries with commas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ImageUploadField
            label="Profile photo"
            folder="agents"
            mode="single"
            value={photo}
            onChange={setPhoto}
            hint="A square headshot works best. Up to 8MB."
          />
          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="languages">Languages</Label>
              <Input
                id="languages"
                value={form.languages}
                onChange={(event) => set("languages", event.target.value)}
                placeholder="English, Hindi, Arabic"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties</Label>
              <Input
                id="specialties"
                value={form.specialties}
                onChange={(event) => set("specialties", event.target.value)}
                placeholder="Off-plan, Luxury villas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceAreas">Areas covered</Label>
              <Input
                id="serviceAreas"
                value={form.serviceAreas}
                onChange={(event) => set("serviceAreas", event.target.value)}
                placeholder="Business Bay, Dubai Marina"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            Send for approval
          </CardTitle>
          <CardDescription>
            {hasPending
              ? "You already have changes waiting. Sending again replaces that request."
              : "A superadmin reviews your changes before they appear on the website."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">Note for the reviewer (optional)</Label>
            <Textarea
              id="note"
              rows={3}
              value={form.note}
              onChange={(event) => set("note", event.target.value)}
              placeholder="New headshot and updated RERA number."
            />
          </div>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Send className="mr-2 size-4" />
            )}
            {pending ? "Sending…" : "Send for approval"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
