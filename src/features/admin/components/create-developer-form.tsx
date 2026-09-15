"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createDeveloperAction } from "@/actions/catalog";
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

export function CreateDeveloperForm({
  organizationId,
  redirectOnCreate = false,
}: {
  organizationId: string;
  redirectOnCreate?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [headquarters, setHeadquarters] = useState("Dubai");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Card className="card-elevated border-border/80">
      <CardHeader>
        <CardTitle className="font-display text-xl">Add developer</CardTitle>
        <CardDescription>
          Creates a catalog record for property cards and SEO hubs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            const result = await createDeveloperAction({
              organizationId,
              name,
              shortDescription: shortDescription || null,
              website: website || null,
              email: email || null,
              phone: phone || null,
              headquarters: headquarters || null,
              metaTitle: metaTitle || null,
              metaDescription: metaDescription || null,
              isPublished: true,
            });
            setLoading(false);
            if (!result.ok) {
              setError(result.error);
              toast.error(result.error);
              return;
            }
            toast.success("Developer created");
            const id =
              result.data &&
              typeof result.data === "object" &&
              "id" in result.data
                ? String((result.data as { id: string }).id)
                : null;
            if (redirectOnCreate && id) {
              router.push(`/admin/developers/${id}`);
            } else {
              setName("");
              setShortDescription("");
              setWebsite("");
              setEmail("");
              setPhone("");
              router.refresh();
            }
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dev-name">Name</Label>
              <Input
                id="dev-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dev-website">Website</Label>
              <Input
                id="dev-website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dev-hq">Headquarters</Label>
              <Input
                id="dev-hq"
                value={headquarters}
                onChange={(e) => setHeadquarters(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dev-email">Email</Label>
              <Input
                id="dev-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dev-phone">Phone</Label>
              <Input
                id="dev-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dev-desc">Short description</Label>
              <Textarea
                id="dev-desc"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dev-meta-title">Meta title</Label>
              <Input
                id="dev-meta-title"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dev-meta-desc">Meta description</Label>
              <Input
                id="dev-meta-desc"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Create developer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
