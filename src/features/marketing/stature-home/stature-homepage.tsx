import Image from "next/image";

import { statureContent, statureWhatsAppHref } from "@/config/stature";
import { StatureEnquireForm } from "@/features/marketing/stature-home/stature-enquire-form";
import { StatureFooter } from "@/features/marketing/stature-home/stature-footer";
import { StatureHeader } from "@/features/marketing/stature-home/stature-header";
import { StatureHeroEnquire } from "@/features/marketing/stature-home/stature-hero-enquire";
import { StatureReveal } from "@/features/marketing/stature-home/stature-reveal";
import { StatureStashLink } from "@/features/marketing/stature-home/stature-stash-link";

import "@/features/marketing/homepage/homepage.css";
import "@/features/marketing/stature-home/stature-home.css";

export function StatureHomepage() {
  const content = statureContent;

  return (
    <div className="stature-home flex min-h-screen flex-col bg-[#faf9f8] text-[#141414]">
      <a
        href="#main-content"
        className="absolute left-4 top-4 z-[100] -translate-y-[180%] bg-[var(--red)] px-4 py-2 text-sm font-semibold text-white transition focus:translate-y-0 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--ink)]"
      >
        Skip to content
      </a>
      <StatureHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 bg-white outline-none">
        <section className="hp-hero" id="top" aria-label="Find a home in Bengaluru">
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
              <StatureReveal delayMs={0}>
                <p className="hp-eyebrow">{content.hero.eyebrow}</p>
              </StatureReveal>
              <StatureReveal delayMs={80}>
                <h1>{content.hero.title}</h1>
              </StatureReveal>
              <StatureReveal delayMs={140}>
                <p className="hp-lede">{content.hero.lede}</p>
              </StatureReveal>
              <StatureReveal delayMs={200}>
                <StatureHeroEnquire />
              </StatureReveal>
            </div>
          </div>
        </section>

        <div className="hp-trust">
          <div className="hp-wrap">
            {content.trust.map((item) => (
              <span key={item.label} className="t">
                <b>{item.value}</b>
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <section className="hp-section" id="services">
          <div className="hp-wrap">
            <StatureReveal mode="scroll">
              <div className="hp-sec-head">
                <div>
                  <p className="hp-eyebrow">{content.paths.eyebrow}</p>
                  <h2>{content.paths.title}</h2>
                </div>
              </div>
            </StatureReveal>
            <div className="hp-paths">
              {content.paths.items.map((item, index) => (
                <StatureReveal key={item.n} mode="scroll" delayMs={index * 70}>
                  <a className="hp-path" href={item.href}>
                    <div>
                      <span className="n">{item.n}</span>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </div>
                    <span className="arw">{item.cta}</span>
                  </a>
                </StatureReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="hp-section" id="projects" style={{ background: "var(--mist)" }}>
          <div className="hp-wrap">
            <StatureReveal mode="scroll">
              <div className="hp-sec-head">
                <div>
                  <p className="hp-eyebrow">{content.featured.eyebrow}</p>
                  <h2>{content.featured.title}</h2>
                  <p>{content.featured.description}</p>
                </div>
                <a className="hp-link-more" href="#contact">
                  Ask for a site visit →
                </a>
              </div>
            </StatureReveal>
            <div className="hp-grid3">
              {content.projects.map((card, index) => (
                <StatureReveal key={card.id} mode="scroll" delayMs={index * 90}>
                  <StatureStashLink
                    className="hp-pcard"
                    href="#contact"
                    stash={{
                      interest: "Site visit",
                      note: `${card.name}, ${card.location}`,
                    }}
                  >
                    <div className="ph">
                      <span className="tag">{card.tag}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={card.coverUrl} alt={card.name} />
                    </div>
                    <div className="body">
                      <span className="loc">{card.location}</span>
                      <h3>{card.name}</h3>
                      <div className="meta">
                        <span>
                          From
                          <b>{card.priceLabel}</b>
                        </span>
                        <span>
                          Type
                          <b>{card.planLabel}</b>
                        </span>
                        <span>
                          Note
                          <b>{card.handoverLabel}</b>
                        </span>
                      </div>
                    </div>
                  </StatureStashLink>
                </StatureReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="hp-section" id="contact">
          <div className="hp-wrap">
            <div className="hp-split">
              <div className="l">
                <p className="hp-eyebrow">{content.enquire.eyebrow}</p>
                <h2>{content.enquire.title}</h2>
                <p>{content.enquire.body}</p>
                <a
                  className="hp-btn hp-btn-ghost"
                  href={statureWhatsAppHref(
                    "Hi Stature, I would like to talk about a home in Bengaluru.",
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  {content.enquire.ctaLabel}
                </a>
              </div>
              <div className="r">
                <h3>{content.enquire.formTitle}</h3>
                <StatureEnquireForm />
                <p className="hp-form-note">{content.enquire.formNote}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="hp-section" id="areas" style={{ background: "var(--mist)" }}>
          <div className="hp-wrap">
            <div className="hp-sec-head">
              <div>
                <p className="hp-eyebrow">{content.areas.eyebrow}</p>
                <h2>{content.areas.title}</h2>
                <p>{content.areas.description}</p>
              </div>
            </div>
            <div className="hp-areas">
              {content.areas.items.map((area) => (
                <StatureStashLink
                  key={area.name}
                  className="hp-area"
                  href="#contact"
                  stash={{
                    interest: "Buy a home",
                    note: area.name,
                  }}
                >
                  {area.name}
                  <small>{area.subtitle}</small>
                </StatureStashLink>
              ))}
            </div>
          </div>
        </section>

        <section className="hp-section" id="about">
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
                  <g stroke="#2BB3A0" strokeWidth="3" fill="none">
                    <polyline points="40,320 120,280 200,300 280,210 360,240 460,120" />
                  </g>
                  <g fill="#1B3F6E">
                    <circle cx="120" cy="280" r="4" />
                    <circle cx="280" cy="210" r="4" />
                    <circle cx="460" cy="120" r="4" />
                  </g>
                  <g fill="rgba(255,255,255,.08)">
                    <rect x="40" y="340" width="30" height="30" />
                    <rect x="90" y="330" width="30" height="40" />
                    <rect x="140" y="345" width="30" height="25" />
                    <rect x="190" y="320" width="30" height="50" />
                    <rect x="240" y="300" width="30" height="70" />
                    <rect x="290" y="310" width="30" height="60" />
                  </g>
                </svg>
              </div>
              <div className="txt">
                <p className="hp-eyebrow">{content.about.eyebrow}</p>
                <h2>{content.about.title}</h2>
                <p>{content.about.body}</p>
                <div className="hp-stat-row">
                  {content.about.stats.map((stat) => (
                    <div key={stat.label} className="hp-stat">
                      <b>{stat.value}</b>
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>
                <a href="#contact" className="hp-btn hp-btn-solid">
                  {content.about.ctaLabel}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <StatureFooter />
      <a
        className="hp-wafab"
        href={statureWhatsAppHref(
          "Hi Stature, I would like to enquire about a home in Bengaluru.",
        )}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
      >
        Chat
      </a>
    </div>
  );
}
