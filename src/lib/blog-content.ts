/**
 * Blog covers ride along in the body as an HTML comment, so a post needs no
 * extra media join to render a hero image.
 */
const COVER_PATTERN = /^<!--cover:(.*?)-->\n?([\s\S]*)$/;

export function splitBlogCover(content: string | null | undefined) {
  if (!content) return { coverUrl: null as string | null, body: "" };
  const match = content.match(COVER_PATTERN);
  if (!match) return { coverUrl: null as string | null, body: content };
  return { coverUrl: match[1] || null, body: match[2] ?? "" };
}

export function embedBlogCover(
  content: string | null | undefined,
  coverUrl: string | null | undefined,
) {
  const { body } = splitBlogCover(content ?? "");
  const trimmedCover = coverUrl?.trim();
  if (!trimmedCover) return body.trim() ? body : null;
  return `<!--cover:${trimmedCover}-->\n${body}`;
}
