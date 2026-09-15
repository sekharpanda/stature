"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createFormDefinitionAction } from "@/actions/cms";
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

export function CreateFormDefinition({
  organizationId,
}: {
  organizationId: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Card className="card-elevated border-border/80">
      <CardHeader>
        <CardTitle className="font-display text-xl">Create form</CardTitle>
        <CardDescription>
          Starts with name, email, phone and message fields. Edit fields on the
          form detail page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            const result = await createFormDefinitionAction({
              organizationId,
              name,
              description: description || null,
            });
            setLoading(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.push(`/admin/forms/${result.data.id}`);
            router.refresh();
          }}
        >
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="form-name">Name</Label>
            <Input
              id="form-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contact callback"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="form-desc">Description</Label>
            <Textarea
              id="form-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes for your team"
              rows={2}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive md:col-span-2">{error}</p>
          ) : null}
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create form"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
