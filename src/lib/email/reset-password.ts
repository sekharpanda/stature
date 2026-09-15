import { getAppBaseUrl, sendEmail } from "@/lib/email/client";
import { renderResetPasswordEmail } from "@/lib/email/templates/reset-password";

export function buildPasswordResetUrl(token: string) {
  return `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  token: string;
}) {
  const content = renderResetPasswordEmail({
    name: input.name,
    resetUrl: buildPasswordResetUrl(input.token),
  });

  return sendEmail({
    to: input.to,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });
}
