export type CanonicalBlogPost = {
  externalId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverUrl: string | null;
  publishedAt: Date | null;
  canonicalUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

export type BlogFetchResult = {
  posts: CanonicalBlogPost[];
  page: number;
  hasMore: boolean;
  total?: number;
};

export type BlogProviderContext = {
  baseUrl: string;
  apiKey: string | null;
};
