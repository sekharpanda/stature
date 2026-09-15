import { NextResponse } from "next/server";

import { stature } from "@/config/stature";
import { sendEmail } from "@/lib/email";
import { pushHelloLead } from "@/lib/helloleads";

export const runtime = "nodejs";

type Body = {
  name?: string;
  phone?: string;
  email?: string;
  interest?: string;
  message?: string;
  source?: string;
  consent?: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  page?: string;
};

function str(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = str(body.name, 120);
  const phone = str(body.phone, 40);
  const email = str(body.email, 120);
  const interest = str(body.interest, 80);
  const message = str(body.message, 2000);
  const source = str(body.source, 80) || "website";

  if (!name || !phone) {
    return NextResponse.json(
      { error: "Name and phone are required." },
      { status: 400 },
    );
  }

  if (!body.consent) {
    return NextResponse.json(
      { error: "Consent is required." },
      { status: 400 },
    );
  }

  const lead = {
    name,
    phone,
    email,
    interest,
    message,
    source,
    utm_source: str(body.utm_source, 80),
    utm_medium: str(body.utm_medium, 80),
    utm_campaign: str(body.utm_campaign, 120),
    utm_content: str(body.utm_content, 120),
    gclid: str(body.gclid, 120),
    fbclid: str(body.fbclid, 120),
    page: str(body.page, 500),
  };

  const hello = await pushHelloLead(lead);

  const to = (process.env.LEAD_TO || stature.email).trim();
  let emailed = false;
  if (to && process.env.EMAIL_PROVIDER) {
    try {
      const lines = [
        `Name: ${name}`,
        `Phone: ${phone}`,
        email ? `Email: ${email}` : "",
        `Interest: ${interest}`,
        `Source: ${source}`,
        message ? `Message: ${message}` : "",
        lead.utm_source ? `utm_source: ${lead.utm_source}` : "",
        lead.gclid ? `gclid: ${lead.gclid}` : "",
        lead.fbclid ? `fbclid: ${lead.fbclid}` : "",
        lead.page ? `Page: ${lead.page}` : "",
        hello.ok ? "CRM: HelloLeads" : "CRM: not stored",
      ].filter(Boolean);
      const text = lines.join("\n");
      await sendEmail({
        to,
        subject: `Stature enquiry — ${interest || source}`,
        text,
        html: `<pre>${text.replace(/</g, "&lt;")}</pre>`,
      });
      emailed = true;
    } catch {
      emailed = false;
    }
  }

  if (hello.ok || emailed) {
    return NextResponse.json({
      ok: true,
      helloleads: hello.ok,
      emailed,
    });
  }

  return NextResponse.json(
    {
      error: "Lead desk is not configured yet.",
      helloleads: false,
    },
    { status: 503 },
  );
}
