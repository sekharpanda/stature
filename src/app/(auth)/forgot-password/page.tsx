import { ForgotPasswordForm } from "@/features/admin/components/forgot-password-form";
import { ThemeToggle } from "@/features/admin/components/shell/theme-toggle";

export const metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <ForgotPasswordForm />
    </main>
  );
}
