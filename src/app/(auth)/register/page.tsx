import { RegisterForm } from "@/features/portal/components/register-form";
import { ThemeToggle } from "@/features/admin/components/shell/theme-toggle";

export const metadata = {
  title: "Request Agent Access",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <RegisterForm />
    </main>
  );
}
