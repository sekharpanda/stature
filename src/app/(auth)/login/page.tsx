import { Suspense } from "react";

import { LoginForm } from "@/features/admin/components/login-form";
import { ThemeToggle } from "@/features/admin/components/shell/theme-toggle";

export const metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
