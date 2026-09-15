"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Clock, Loader2 } from "lucide-react";

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
import { requestPortalAccessAction } from "@/actions/portal-access";

export function RegisterForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    reraNumber: "",
    password: "",
    note: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await requestPortalAccessAction(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSent(true);
    });
  }

  // Sign-up deliberately does not create a session, so there is nowhere to send
  // them yet; confirm here and let them sign in once a superadmin approves.
  if (sent) {
    return (
      <Card className="card-elevated w-full max-w-lg border-border/80 shadow-none">
        <CardHeader>
          <span className="flex size-11 items-center justify-center rounded-full bg-amber-100 text-amber-900">
            <Clock className="size-5" />
          </span>
          <CardTitle className="mt-3 font-display text-2xl">
            Request sent
          </CardTitle>
          <CardDescription>
            A superadmin will review your request. Once it is approved you can
            sign in with {form.email} and start managing your profile, listings
            and articles.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/">Back to website</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated w-full max-w-lg border-border/80 shadow-none">
      <CardHeader>
        <p className="eyebrow">Prowin Properties</p>
        <CardTitle className="font-display text-3xl font-medium">
          Request agent access
        </CardTitle>
        <CardDescription>
          Create your login and a superadmin will approve it. Once approved you
          can manage your profile, listings and articles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
              autoComplete="name"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => set("email", event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(event) => set("phone", event.target.value)}
                autoComplete="tel"
                placeholder="+971 50 000 0000"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reraNumber">RERA / BRN number</Label>
              <Input
                id="reraNumber"
                value={form.reraNumber}
                onChange={(event) => set("reraNumber", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => set("password", event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Anything we should know? (optional)</Label>
            <Textarea
              id="note"
              rows={3}
              value={form.note}
              onChange={(event) => set("note", event.target.value)}
              placeholder="I joined the Business Bay team in March."
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {pending ? "Sending request…" : "Request access"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already approved?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
