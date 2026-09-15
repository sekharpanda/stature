/** Trust-strip items that are synced from Google Places (not CMS-editable). */
export function isGoogleReviewsTrustItem(item: {
  value: string;
  label: string;
  href?: string;
}) {
  return (
    /google\s*reviews/i.test(item.label) ||
    /★/.test(item.value) ||
    Boolean(
      item.href &&
        (/google\.com\/local\/reviews/i.test(item.href) ||
          /placeid=/i.test(item.href)),
    )
  );
}
