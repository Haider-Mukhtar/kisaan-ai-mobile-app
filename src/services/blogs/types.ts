export type BlogLanguage = "en" | "ur";

export type BlogBlock = {
  id: string;
  type: "heading" | "paragraph" | "list-item" | "quote";
  text: string;
  level?: number;
};

export type BlogArticle = {
  slug: string;
  url: string;
  title: string;
  titles: Record<BlogLanguage, string>;
  author: string;
  publishedAt: string;
  updatedAt: string;
  imageUrl: string | null;
  content: Record<BlogLanguage, BlogBlock[]>;
};

export type BlogSnapshot = {
  articles: BlogArticle[];
  fetchedAt: string;
};
