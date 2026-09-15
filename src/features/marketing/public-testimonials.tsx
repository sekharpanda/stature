export type PublicTestimonialItem = {
  id: string;
  authorName: string;
  authorRole: string | null;
  content: string;
  rating: number | null;
};

export function PublicTestimonials({
  items,
  title = "What clients say",
  eyebrow = "Testimonials",
  embedded = false,
}: {
  items: PublicTestimonialItem[];
  title?: string;
  eyebrow?: string;
  embedded?: boolean;
}) {
  if (items.length === 0) return null;

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
        className={`${title || eyebrow ? "mt-10" : ""} grid gap-6 md:grid-cols-2 lg:grid-cols-3`}
      >
        {items.map((item) => (
          <figure
            key={item.id}
            className="flex h-full flex-col border border-line bg-white p-6"
          >
            {item.rating != null ? (
              <p className="text-sm font-semibold text-red">
                {Number(item.rating).toFixed(1)}★
              </p>
            ) : null}
            <blockquote className="mt-3 flex-1 text-base text-ink whitespace-pre-wrap">
              “{item.content}”
            </blockquote>
            <figcaption className="mt-6 border-t border-line pt-4">
              <p className="font-semibold text-ink">{item.authorName}</p>
              {item.authorRole ? (
                <p className="text-sm text-slate">{item.authorRole}</p>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );

  if (embedded) return <div>{inner}</div>;

  return (
    <section className="border-b border-line bg-mist">
      <div className="mx-auto max-w-[1180px] px-6 py-16">{inner}</div>
    </section>
  );
}
