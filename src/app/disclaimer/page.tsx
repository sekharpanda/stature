import type { Metadata } from "next";
import Link from "next/link";

import { stature } from "@/config/stature";
import { StatureLegalShell } from "@/features/marketing/stature-home/stature-legal-shell";

export const metadata: Metadata = {
  title: "Advertising disclaimer",
  description: `RERA and advertising disclaimer for ${stature.legalName}, including Facebook and Google ads.`,
};

export default function DisclaimerPage() {
  return (
    <StatureLegalShell
      eyebrow="Legal"
      title="Advertising disclaimer"
      lede="This page is for Facebook, Google and other ads as well as this website. Please read it before you enquire or book a visit."
    >
      <p>Last updated: 15 September 2026</p>
      <h2>Not an offer or prospectus</h2>
      <p>
        Content on this website and in {stature.name} ads is for general
        information. It is not a prospectus, not an invitation to subscribe,
        and not a guarantee of allotment, price, possession date or loan.
      </p>
      <h2>RERA and developers</h2>
      <p>
        Where a project is registered under RERA, rely on the RERA registration
        number, sanctioned plans and the developer’s official documents — not
        only on an advertisement or this site. We market and assist; we are
        not the promoter unless a specific listing says otherwise.
      </p>
      <h2>Prices and availability</h2>
      <p>
        Starting prices, configurations and “from” figures can change. Stock
        and offers depend on the developer and on the date of your visit.
        Photographs may be typical views, not the exact unit.
      </p>
      <h2>Facebook and Google ads</h2>
      <p>
        Ads may use targeting, retargeting and conversion measurement. Clicking
        an ad can open this site with a lead form. Submitting the form means
        you ask us to contact you. Campaign parameters (including click IDs)
        may be stored with the enquiry so we can see which ad worked.         Policy
        links for ads:{" "}
        <Link href="/privacy">Privacy</Link>,{" "}
        <Link href="/terms">Terms</Link> and{" "}
        <Link href="/cookies">Cookies</Link>.
      </p>
      <h2>Home loans</h2>
      <p>
        Loan help is facilitation only. Banks decide eligibility, rate and
        disbursement.
      </p>
      <p>
        Questions: <a href={`mailto:${stature.email}`}>{stature.email}</a>
      </p>
    </StatureLegalShell>
  );
}
