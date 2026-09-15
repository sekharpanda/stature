"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createTestimonialAction } from "@/actions/cms";
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

export function CreateTestimonialForm({
  organizationId,
}: {
  organizationId: string;
}) {
  const router = useRouter();
  const [authorName, setAuthorName] = useState("");
  const [authorRole, setAuthorRole] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Card className="card-elevated border-border/80">
      <CardHeader>
        <CardTitle className="font-display text-xl">Add testimonial</CardTitle>
        <CardDescription>
          Client quotes for homepage and landing social proof.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            const result = await createTestimonialAction({
              organizationId,
              authorName,
              authorRole: authorRole || null,
              content,
            });
            setLoading(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setAuthorName("");
            setAuthorRole("");
            setContent("");
            router.refresh();
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="t-name">Name</Label>
              <Input
                id="t-name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-role">Role / company</Label>
              <Input
                id="t-role"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="t-quote">Quote</Label>
              <Textarea
                id="t-quote"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Create testimonial"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
