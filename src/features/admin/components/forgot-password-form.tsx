"use client";

import Link from "next/link";
import { useState } from "react";
import { MailCheck } from "lucide-react";

import { requestPasswordReset } from "@/lib/auth/auth-client";
import { forgotPasswordSchema } from "@/schemas/auth.schema";
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

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email");
      return;
    }

    setLoading(true);
    const { error: resetError } = await requestPasswordReset({
      email: parsed.data.email,
    });
    setLoading(false);

    if (resetError) {
      setError(
        resetError.message ||
          "We could not send a reset email right now. Try again or ask an administrator.",
      );
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <Card className="card-elevated w-full max-w-md border-border/80 shadow-none">
        <CardHeader>
          <span className="flex size-11 items-center justify-center rounded-full bg-amber-100 text-amber-900">
            <MailCheck className="size-5" />
          </span>
          <CardTitle className="mt-3 font-display text-2xl">
            Check your email
          </CardTitle>
          <CardDescription>
            If an account exists for {email}, we sent a link to choose a new
            password. It expires in one hour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full" variant="outline">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated w-full max-w-md border-border/80 shadow-none">
      <CardHeader>
        <p className="eyebrow">Prowin Properties</p>
        <CardTitle className="font-display text-3xl font-medium">
          Forgot password
        </CardTitle>
        <CardDescription>
          Enter the email on your account and we will send a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending link…" : "Send reset link"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
