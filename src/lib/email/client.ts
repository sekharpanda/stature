import nodemailer from "nodemailer";
import { Resend } from "resend";

import { AppError } from "@/lib/errors";

export function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function getEmailFrom() {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    "Prowin Properties <tech@prowinproperties.com>"
  );
}

type EmailProvider = "gsuite" | "smtp" | "resend";

function resolveProvider(): EmailProvider {
  const explicit = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (explicit === "gsuite" || explicit === "smtp" || explicit === "resend") {
    return explicit;
  }
  if (process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()) {
    return "gsuite";
  }
  if (process.env.RESEND_API_KEY?.trim()) return "resend";
  throw new AppError(
    "Email is not configured. For Google Workspace set SMTP_USER + SMTP_PASS (App Password) and EMAIL_FROM, or set RESEND_API_KEY.",
    { code: "EMAIL_NOT_CONFIGURED", status: 503 },
  );
}

function createSmtpTransport() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) {
    throw new AppError(
      "Google Workspace SMTP needs SMTP_USER and SMTP_PASS (16-character App Password).",
      { code: "EMAIL_NOT_CONFIGURED", status: 503 },
    );
  }

  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? "465");
  const secure =
    process.env.SMTP_SECURE != null
      ? process.env.SMTP_SECURE === "true"
      : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

async function sendViaSmtp(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const transport = createSmtpTransport();
  try {
    const info = await transport.sendMail({
      from: getEmailFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { id: info.messageId };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send email via SMTP";
    throw new AppError(message, {
      code: "EMAIL_SEND_FAILED",
      status: 502,
      details: error,
    });
  }
}

async function sendViaResend(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new AppError("RESEND_API_KEY is missing.", {
      code: "EMAIL_NOT_CONFIGURED",
      status: 503,
    });
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    throw new AppError(error.message || "Failed to send email", {
      code: "EMAIL_SEND_FAILED",
      status: 502,
      details: error,
    });
  }

  return data;
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const provider = resolveProvider();
  if (provider === "resend") {
    return sendViaResend(input);
  }
  return sendViaSmtp(input);
}
