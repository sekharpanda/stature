import sanitizeHtml from "sanitize-html";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Convert legacy plain-text posts into HTML. */
export function normalizeBlogHtml(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return "";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return content;
  return trimmed
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

const ALLOWED_TAGS = [
  "p",
  "br",
  "hr",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "sup",
  "sub",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "a",
  "img",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "span",
  "div",
];

const COMMON_ATTR = ["title", "class", "style", "id"];

/**
 * Pure-JS sanitizer: DOMPurify needs jsdom, which fails to load in the
 * Vercel serverless runtime.
 */
export function sanitizeBlogHtml(content: string) {
  const html = normalizeBlogHtml(content);
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel", ...COMMON_ATTR],
      img: ["src", "alt", "width", "height", "loading", ...COMMON_ATTR],
      th: ["colspan", "rowspan", "scope", ...COMMON_ATTR],
      td: ["colspan", "rowspan", ...COMMON_ATTR],
      "*": COMMON_ATTR,
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.target
          ? { ...attribs, rel: attribs.rel || "noopener noreferrer" }
          : attribs,
      }),
    },
    disallowedTagsMode: "discard",
  });
}

export function blogHtmlToPlainText(content: string) {
  const html = normalizeBlogHtml(content);
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
