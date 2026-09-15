"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createCategoryAction } from "@/actions/catalog";
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

export function CreateCategoryForm({
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
        <CardTitle className="font-display text-xl">Add category</CardTitle>
        <CardDescription>
          Property taxonomy used across filters and listing cards.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            const result = await createCategoryAction({
              organizationId,
              name,
              description: description || null,
            });
            setLoading(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setName("");
            setDescription("");
            router.refresh();
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="category-desc">Description</Label>
              <Textarea
                id="category-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Create category"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
