import { Fragment, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { brand } from "@/config/brand";
import {
  resolveHomepageLayout,
  type HomepageContent,
  type HomepageSectionKey,
} from "@/config/homepage-defaults";
import { LeadCaptureForm } from "@/features/leads/components/lead-capture-form";
import { LeadModalCta } from "@/features/leads/components/site-lead-capture-modal";
import { AgentAvatar } from "@/features/marketing/agent-avatar";
import { HomepageGoogleReviews } from "@/features/marketing/homepage/homepage-google-reviews";
import type { GoogleReviewItem } from "@/services/google-business-reviews.service";

import {
  HomepageHeroSearch,
  HomepageReveal,
} from "./homepage-hero-search";
import "./homepage.css";

export type HomepageFeaturedCard = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  priceLabel: string | null;
  planLabel: string | null;
  handoverLabel: string | null;
  coverUrl: string | null;
  tag: string;
};

export type HomepageAgentCard = {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  photoUrl: string | null;
  whatsapp: string | null;
  languages: string[];
};

function waHref(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function HomepageView({
  content,
  featured,
  agents,
  googleReviews,
  whatsapp,
  modules,
}: {
  content: HomepageContent;
  featured: HomepageFeaturedCard[];
  agents: HomepageAgentCard[];
  googleReviews?: {
    rating: number;
    reviewCount: number;
    reviews: GoogleReviewItem[];
    href: string;
  };
  whatsapp?: string;
  modules?: ReactNode;
}) {
  const cards = featured;
  const team = agents;
  const brandWa = waHref(whatsapp ?? brand.whatsapp);
  const layout = resolveHomepageLayout(content);

  function renderSection(key: HomepageSectionKey) {
    switch (key) {
      case "trust":
        return (
      <div className="hp-trust">
        <div className="hp-wrap">
          {content.trust.map((item) =>
            item.href ? (
              <a
                key={item.label}
                className="t t-link"
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${item.value} ${item.label} — open Google reviews`}
              >
                <b>{item.value}</b>
                {item.label}
              </a>
            ) : (
              <span key={item.label} className="t">
                <b>{item.value}</b>
                {item.label}
              </span>
            ),
          )}
        </div>
      </div>
        );
      case "paths":
        return (
      <section className="hp-section">
        <div className="hp-wrap">
          <HomepageReveal mode="scroll">
            <div className="hp-sec-head">
              <div>
                <p className="hp-eyebrow">{content.paths.eyebrow}</p>
                <h2>{content.paths.title}</h2>
              </div>
            </div>
          </HomepageReveal>
          <div className="hp-paths">
            {content.paths.items.map((item, index) => (
              <HomepageReveal
                key={item.n}
                mode="scroll"
                delayMs={index * 70}
              >
                <Link className="hp-path" href={item.href}>
                  <div>
                    <span className="n">{item.n}</span>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                  <span className="arw">{item.cta}</span>
                </Link>
              </HomepageReveal>
            ))}
          </div>
        </div>
      </section>
        );
      case "featured":
        return (
      <section className="hp-section" style={{ background: "var(--mist)" }}>
        <div className="hp-wrap">
          <HomepageReveal mode="scroll">
            <div className="hp-sec-head">
              <div>
                <p className="hp-eyebrow">{content.featured.eyebrow}</p>
                <h2>{content.featured.title}</h2>
                <p>{content.featured.description}</p>
              </div>
              <Link className="hp-link-more" href={content.featured.viewAllHref}>
                {content.featured.viewAllLabel}
              </Link>
            </div>
          </HomepageReveal>
          {cards.length === 0 ? (
            <div className="hp-featured-empty">
              <p>Featured listings will appear here once they are published.</p>
              <Link className="hp-link-more" href="/properties">
                Browse all properties
              </Link>
            </div>
          ) : (
            <div className="hp-grid3">
              {cards.map((card, index) => {
              const href = card.slug
                ? `/properties/${card.slug}`
                : "/properties";
              return (
                <HomepageReveal
                  key={card.id}
                  mode="scroll"
                  delayMs={index * 90}
                >
                  <Link className="hp-pcard" href={href}>
                    <div className="ph">
                      <span className="tag">{card.tag}</span>
                      {card.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={card.coverUrl} alt={card.name} />
                      ) : (
                        <div className="hp-pcard-fallback" aria-hidden="true">
                          <span>{card.location || "Dubai"}</span>
                        </div>
                      )}
                    </div>
                    <div className="body">
                      {card.location ? (
                        <span className="loc">{card.location}</span>
                      ) : null}
                      <h3>{card.name}</h3>
                      <div className="meta">
                        {card.priceLabel ? (
                          <span>
                            From
                            <b>{card.priceLabel}</b>
                          </span>
                        ) : null}
                        {card.planLabel ? (
                          <span>
                            Plan
                            <b>{card.planLabel}</b>
                          </span>
                        ) : null}
                        {card.handoverLabel ? (
                          <span>
                            Handover
                            <b>{card.handoverLabel}</b>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </HomepageReveal>
              );
            })}
          </div>
          )}
        </div>
      </section>
        );
      case "sellSplit":
        return (
      <section className="hp-section">
        <div className="hp-wrap">
          <div className="hp-split">
            <div className="l">
              <p className="hp-eyebrow">{content.sellSplit.eyebrow}</p>
              <h2>{content.sellSplit.title}</h2>
              <p>{content.sellSplit.body}</p>
              <LeadModalCta
                leadSource="list_property"
                campaign="homepage-sell"
                className="hp-btn hp-btn-ghost"
              >
                {content.sellSplit.ctaLabel}
              </LeadModalCta>
              {googleReviews && googleReviews.reviews.length > 0 ? (
                <HomepageGoogleReviews
                  rating={googleReviews.rating}
                  reviewCount={googleReviews.reviewCount}
                  reviews={googleReviews.reviews}
                  href={googleReviews.href}
                />
              ) : null}
            </div>
            <div className="r">
              <h3>{content.sellSplit.formTitle}</h3>
              <LeadCaptureForm
                leadSource="homepage"
                variant="homepage-dark"
                className="space-y-3"
              />
              <p className="hp-form-note">{content.sellSplit.formNote}</p>
            </div>
          </div>
        </div>
      </section>
        );
      case "areas":
        return (
      <section className="hp-section" style={{ background: "var(--mist)" }}>
        <div className="hp-wrap">
          <div className="hp-sec-head">
            <div>
              <p className="hp-eyebrow">{content.areas.eyebrow}</p>
              <h2>{content.areas.title}</h2>
              <p>{content.areas.description}</p>
            </div>
            <Link className="hp-link-more" href={content.areas.viewAllHref}>
              All areas →
            </Link>
          </div>
          <div className="hp-areas">
            {content.areas.items.map((area) => (
              <Link key={area.name} className="hp-area" href={area.href}>
                {area.name}
                <small>{area.subtitle}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>
        );
      case "team":
        if (team.length === 0) return null;
        return (
      <section className="hp-section">
        <div className="hp-wrap">
          <div className="hp-sec-head">
            <div>
              <p className="hp-eyebrow">{content.team.eyebrow}</p>
              <h2>{content.team.title}</h2>
              <p>{content.team.description}</p>
            </div>
            <Link className="hp-link-more" href={content.team.viewAllHref}>
              View all agents →
            </Link>
          </div>
          <div className="hp-team">
            {team.map((agent) => {
              const agentWa = agent.whatsapp
                ? waHref(agent.whatsapp, `Hi ${agent.name}, I'd like to enquire.`)
                : brandWa;
              const profileHref = agent.slug
                ? `/our-team/${agent.slug}`
                : "/our-team";
              return (
                <div key={agent.id} className="hp-agent">
                  <Link href={profileHref} className="av">
                    <AgentAvatar
                      name={agent.name}
                      photoUrl={agent.photoUrl}
                      className="h-full w-full object-cover"
                      initialsClassName="hp-agent-initials"
                    />
                  </Link>
                  <h3>
                    <Link href={profileHref}>{agent.name}</Link>
                  </h3>
                  <div className="role">{agent.title || "Property Consultant"}</div>
                  {agent.languages.length > 0 ? (
                    <div className="lang">{agent.languages.join(" · ")}</div>
                  ) : null}
                  <a
                    className="wa"
                    href={agentWa}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp →
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>
        );
      case "insight":
        return (
      <section className="hp-section" style={{ background: "var(--mist)" }}>
        <div className="hp-wrap">
          <div className="hp-insight">
            <div className="cover" aria-hidden="true">
              <svg
                viewBox="0 0 500 400"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  inset: 0,
                }}
              >
                <rect width="500" height="400" fill="#141414" />
                <g stroke="#A01919" strokeWidth="3" fill="none">
                  <polyline points="40,320 120,280 200,300 280,210 360,240 460,120" />
                </g>
                <g fill="#e9c9a0">
                  <circle cx="120" cy="280" r="4" />
                  <circle cx="280" cy="210" r="4" />
                  <circle cx="460" cy="120" r="4" />
                </g>
                <g fill="rgba(255,255,255,.08)">
                  <rect x="40" y="340" width="30" height="30" />
                  <rect x="90" y="330" width="30" height="40" />
                  <rect x="140" y="345" width="30" height="25" />
                </g>
              </svg>
            </div>
            <div className="txt">
              <p className="hp-eyebrow">{content.insight.eyebrow}</p>
              <h2>{content.insight.title}</h2>
              <p>{content.insight.body}</p>
              <div className="hp-stat-row">
                {content.insight.stats.map((stat) => (
                  <div key={stat.label} className="hp-stat">
                    <b>{stat.value}</b>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
              {content.insight.ctaHref.startsWith("/contact") ? (
                <LeadModalCta
                  leadSource="homepage_insight"
                  campaign="homepage-insight"
                  className="hp-btn hp-btn-solid"
                >
                  {content.insight.ctaLabel}
                </LeadModalCta>
              ) : (
                <Link
                  href={content.insight.ctaHref || "/market-insights"}
                  className="hp-btn hp-btn-solid"
                >
                  {content.insight.ctaLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
        );
      case "seoLinks":
        return (
      <div className="hp-seo">
        <div className="hp-wrap">
          <p className="hp-eyebrow">{content.seoLinks.eyebrow}</p>
          <h2>{content.seoLinks.title}</h2>
          <div className="cols">
            {content.seoLinks.columns.map((col) => (
              <div key={col.heading} className="col">
                <h3>{col.heading}</h3>
                {col.links.map((link) => (
                  <Link key={link.href + link.label} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
        );
      case "modules":
        if (!modules) return null;
        return (
          <section className="hp-section">
            <div className="hp-wrap">{modules}</div>
          </section>
        );
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="hp-hero" aria-label="Search Dubai property">
        <div className="hp-hero-photo" aria-hidden="true">
          <Image
            src={content.hero.imageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="hp-hero-scrim" aria-hidden="true" />
        <div className="hp-hero-inner">
          <div className="hp-wrap">
            <HomepageReveal delayMs={0}>
              <p className="hp-eyebrow">{content.hero.eyebrow}</p>
            </HomepageReveal>
            <HomepageReveal delayMs={80}>
              <h1>{content.hero.title}</h1>
            </HomepageReveal>
            {content.hero.lede.trim() ? (
              <HomepageReveal delayMs={140}>
                <p className="hp-lede">{content.hero.lede}</p>
              </HomepageReveal>
            ) : null}
            <HomepageReveal delayMs={200}>
              <HomepageHeroSearch placeholder={content.hero.searchPlaceholder} />
            </HomepageReveal>
          </div>
        </div>
      </section>

      {layout.map((key) => (
        <Fragment key={key}>{renderSection(key)}</Fragment>
      ))}


      <a
        className="hp-wafab"
        href={brandWa}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
      >
        Chat
      </a>
    </div>
  );
}
