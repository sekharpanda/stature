import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { sendPasswordResetEmail } from "@/lib/email/reset-password";
import { getAuthTrustedOrigins } from "@/lib/hosting-readiness";
import { prisma } from "@/lib/db";

const authSecret =
  process.env.BETTER_AUTH_SECRET ??
  // Dev/build fallback only — set BETTER_AUTH_SECRET in .env.local for real use
  "prowin-phase0-dev-secret-replace-immediately-32c";

/**
 * Better Auth — email/password + Next.js cookie helper.
 * RBAC is enforced in services via permissions catalog.
 */
export const auth = betterAuth({
  secret: authSecret,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  trustedOrigins: getAuthTrustedOrigins(),
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    /**
     * Sign-up only happens on the public consultant request form. Creating a
     * session there would replace whoever is already signed in (a superadmin
     * reviewing the page loses their session) and would hand a live session to
     * an account that has no roles until it is approved.
     */
    autoSignIn: false,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, token }) => {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token,
      });
    },
  },
  user: {
    additionalFields: {
      organizationId: {
        type: "string",
        required: false,
        input: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "ACTIVE",
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
