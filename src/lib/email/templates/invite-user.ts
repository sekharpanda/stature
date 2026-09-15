import { getAppBaseUrl } from "@/lib/email/client";

export function renderInviteUserEmail(input: {
  inviteeName: string;
  organizationName: string;
  roleName: string;
  roleSlug?: string;
  email: string;
  temporaryPassword: string;
  invitedByName?: string;
}) {
  const nextPath = input.roleSlug === "sales_agent" ? "/admin/my" : "/admin";
  const loginUrl = `${getAppBaseUrl()}/login?next=${encodeURIComponent(nextPath)}`;
  const ctaLabel =
    input.roleSlug === "sales_agent" ? "Open consultant login" : "Open admin login";
  const subject = `You're invited to ${input.organizationName}`;

  const intro = input.invitedByName
    ? `${input.invitedByName} invited you to join ${input.organizationName} as ${input.roleName}.`
    : `You have been invited to join ${input.organizationName} as ${input.roleName}.`;

  const text = [
    `Hi ${input.inviteeName},`,
    "",
    intro,
    "",
    `Sign in: ${loginUrl}`,
    `Email: ${input.email}`,
    `Temporary password: ${input.temporaryPassword}`,
    "",
    "Please sign in and change your password after your first login.",
    "",
    "— Prowin Properties",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
            <tr>
              <td style="padding:28px 28px 12px;background:#111827;color:#ffffff;">
                <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.8;">Prowin Properties</p>
                <h1 style="margin:8px 0 0;font-size:24px;font-weight:600;">You're invited</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hi ${escapeHtml(input.inviteeName)},</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
                  ${
                    input.invitedByName
                      ? `<strong>${escapeHtml(input.invitedByName)}</strong> invited you to join`
                      : "You have been invited to join"
                  }
                  <strong>${escapeHtml(input.organizationName)}</strong>
                  as <strong>${escapeHtml(input.roleName)}</strong>.
                </p>
                <table role="presentation" width="100%" style="margin:20px 0;background:#f4f4f5;border-radius:8px;">
                  <tr>
                    <td style="padding:16px;font-size:14px;line-height:1.7;">
                      <div><strong>Login:</strong> <a href="${loginUrl}" style="color:#b91c1c;">${loginUrl}</a></div>
                      <div><strong>Email:</strong> ${escapeHtml(input.email)}</div>
                      <div><strong>Temporary password:</strong> <code style="font-size:14px;">${escapeHtml(input.temporaryPassword)}</code></div>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52525b;">
                  Sign in with these credentials, then change your password after your first login.
                </p>
                <a href="${loginUrl}" style="display:inline-block;background:#b91c1c;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-size:14px;font-weight:600;">
                  ${ctaLabel}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 24px;font-size:12px;color:#71717a;border-top:1px solid #f4f4f5;">
                If you were not expecting this invite, you can ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
