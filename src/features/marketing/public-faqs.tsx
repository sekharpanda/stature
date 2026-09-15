export type PublicFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export function PublicFaqs({
  faqs,
  title = "Frequently asked questions",
  eyebrow = "FAQs",
  embedded = false,
}: {
  faqs: PublicFaqItem[];
  title?: string;
  eyebrow?: string;
  embedded?: boolean;
}) {
  if (faqs.length === 0) return null;

  const inner = (
    <>
      {eyebrow ? (
        <p className="text-xs font-semibold tracking-[0.22em] text-red uppercase">
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h2
          className={
            eyebrow
              ? "mt-3 font-display text-3xl md:text-4xl"
              : "font-display text-3xl md:text-4xl"
          }
        >
          {title}
        </h2>
      ) : null}
      <div
        className={`${title || eyebrow ? "mt-10" : ""} divide-y divide-line border-t border-line`}
      >
        {faqs.map((faq) => (
          <details key={faq.id} className="group py-5">
            <summary className="cursor-pointer list-none font-display text-xl marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-4">
                {faq.question}
                <span
                  aria-hidden
                  className="mt-1 text-slate transition group-open:rotate-45"
                >
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 max-w-[62ch] text-base text-slate whitespace-pre-wrap">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </>
  );

  if (embedded) return <div>{inner}</div>;

  return (
    <section className="border-b border-line bg-white">
      <div className="mx-auto max-w-[1180px] px-6 py-16">{inner}</div>
    </section>
  );
}
