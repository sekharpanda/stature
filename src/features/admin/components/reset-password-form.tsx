"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { resetPassword } from "@/lib/auth/auth-client";
import { resetPasswordSchema } from "@/schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordInput } from "@/features/admin/components/password-input";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const invalidLink = searchParams.get("error") === "INVALID_TOKEN";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(
    invalidLink ? "This reset link is invalid or has expired." : null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link is missing a token. Request a new one.");
      return;
    }

    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the new password");
      return;
    }

    setLoading(true);
    const { error: resetError } = await resetPassword({
      newPassword: parsed.data.password,
      token,
    });
    setLoading(false);

    if (resetError) {
      setError(
        resetError.message ||
          "This reset link is invalid or has expired. Request a new one.",
      );
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <Card className="card-elevated w-full max-w-md border-border/80 shadow-none">
      <CardHeader>
        <p className="eyebrow">Prowin Properties</p>
        <CardTitle className="font-display text-3xl font-medium">
          Choose a new password
        </CardTitle>
        <CardDescription>
          Use at least 8 characters. You will sign in with this password next
          time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading || !token}>
            {loading ? "Saving…" : "Update password"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/forgot-password" className="underline">
              Request a new link
            </Link>
            {" · "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
