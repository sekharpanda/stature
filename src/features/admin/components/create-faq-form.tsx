"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createFaqAction } from "@/actions/cms";
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

export function CreateFaqForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Card className="card-elevated border-border/80">
      <CardHeader>
        <CardTitle className="font-display text-xl">Add FAQ</CardTitle>
        <CardDescription>
          General FAQ entries for site sections and schema markup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            const result = await createFaqAction({
              organizationId,
              question,
              answer,
            });
            setLoading(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setQuestion("");
            setAnswer("");
            router.refresh();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="faq-q">Question</Label>
            <Input
              id="faq-q"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="faq-a">Answer</Label>
            <Textarea
              id="faq-a"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Create FAQ"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
