export function renderResetPasswordEmail(input: {
  name: string;
  resetUrl: string;
}) {
  const greetingName = input.name.trim() || "there";
  const subject = "Reset your Prowin Properties password";

  const text = [
    `Hi ${greetingName},`,
    "",
    "We received a request to reset the password for your Prowin Properties account.",
    "",
    `Reset your password: ${input.resetUrl}`,
    "",
    "This link expires in one hour. If you did not request a reset, you can ignore this email.",
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
                <h1 style="margin:8px 0 0;font-size:24px;font-weight:600;">Reset your password</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hi ${escapeHtml(greetingName)},</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
                  We received a request to reset the password for your Prowin Properties account. The link below expires in one hour.
                </p>
                <a href="${escapeHtml(input.resetUrl)}" style="display:inline-block;background:#b91c1c;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-size:14px;font-weight:600;">
                  Choose a new password
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 24px;font-size:12px;color:#71717a;border-top:1px solid #f4f4f5;">
                If you did not request this, you can ignore this email. Your password will stay the same.
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
