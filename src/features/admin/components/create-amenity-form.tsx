"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createAmenityAction } from "@/actions/catalog";
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

export function CreateAmenityForm({
  organizationId,
}: {
  organizationId: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Card className="card-elevated border-border/80">
      <CardHeader>
        <CardTitle className="font-display text-xl">Add amenity</CardTitle>
        <CardDescription>
          Shared amenity dictionary for property cards and sync imports.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            const result = await createAmenityAction({
              organizationId,
              name,
            });
            setLoading(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setName("");
            router.refresh();
          }}
        >
          <div className="space-y-2 max-w-md">
            <Label htmlFor="amenity-name">Name</Label>
            <Input
              id="amenity-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Create amenity"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
