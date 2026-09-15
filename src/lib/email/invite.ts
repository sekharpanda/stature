import { renderInviteUserEmail } from "@/lib/email/templates/invite-user";
import { sendEmail } from "@/lib/email/client";

export async function sendInviteUserEmail(input: {
  to: string;
  inviteeName: string;
  organizationName: string;
  roleName: string;
  roleSlug?: string;
  temporaryPassword: string;
  invitedByName?: string;
}) {
  const content = renderInviteUserEmail({
    inviteeName: input.inviteeName,
    organizationName: input.organizationName,
    roleName: input.roleName,
    roleSlug: input.roleSlug,
    email: input.to,
    temporaryPassword: input.temporaryPassword,
    invitedByName: input.invitedByName,
  });

  return sendEmail({
    to: input.to,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });
}
