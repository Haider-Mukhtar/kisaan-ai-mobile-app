import * as cheerio from "cheerio";

import type {
  BlogArticle,
  BlogBlock,
  BlogLanguage,
  BlogSnapshot,
} from "@/services/blogs/types";

export const IR_FARM_BLOG_URL = "https://irfarm.com/blogs/latest";
export const IR_FARM_BLOG_FEED_URL = `${IR_FARM_BLOG_URL}.atom`;

const ARTICLE_LIMIT = 5;
const REQUEST_TIMEOUT_MS = 20_000;
const CONTENT_SELECTOR = "h1, h2, h3, h4, p, li, blockquote";

function normalizeUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null;

  const url = value.trim();
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `https://irfarm.com${url}`;
  return url.replace(/^http:\/\//, "https://");
}

function articleSlug(url: string) {
  return url.split("/").filter(Boolean).at(-1) ?? "";
}

function cleanText(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function parseBlocks(html: string, language: BlogLanguage): BlogBlock[] {
  const $ = cheerio.load(html);
  const languageRoot = $(`.lang-${language}`).first();
  const elements =
    languageRoot.length > 0
      ? languageRoot.find(CONTENT_SELECTOR)
      : language === "en"
        ? $(CONTENT_SELECTOR)
        : null;

  if (!elements) return [];

  const blocks: BlogBlock[] = [];

  elements.each((index, element) => {
    const tagName = element.tagName.toLowerCase();
    const parents = $(element).parents("p, li, blockquote");

    if (parents.length > 0) return;

    const text = cleanText($(element).text());
    if (!text) return;

    let type: BlogBlock["type"] = "paragraph";
    let level: number | undefined;

    if (/^h[1-4]$/.test(tagName)) {
      type = "heading";
      level = Number(tagName.slice(1));
    } else if (tagName === "li") {
      type = "list-item";
    } else if (tagName === "blockquote") {
      type = "quote";
    }

    blocks.push({ id: `${language}-${index}`, type, text, level });
  });

  return blocks;
}

function localizedTitle(blocks: BlogBlock[], fallback: string) {
  return blocks.find((block) => block.type === "heading")?.text ?? fallback;
}

export function parseBlogImages(html: string) {
  const $ = cheerio.load(html);
  const images = new Map<string, string>();

  $(".article-card").each((_, card) => {
    const href = $(card).find('a[href*="/blogs/latest/"]').first().attr("href");
    const imageUrl = normalizeUrl($(card).find("img").first().attr("src"));
    const slug = href ? articleSlug(href) : "";

    if (slug && imageUrl) images.set(slug, imageUrl);
  });

  return images;
}

export function parseBlogFeed(xml: string, imageHtml = ""): BlogArticle[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const images = parseBlogImages(imageHtml);
  const articles: BlogArticle[] = [];

  $("entry").slice(0, ARTICLE_LIMIT).each((_, entry) => {
    const node = $(entry);
    const url = normalizeUrl(node.find('link[rel="alternate"]').attr("href"));
    const title = cleanText(node.find("title").first().text());
    const contentHtml = node.find("content").text();

    if (!url || !title || !contentHtml) return;

    const slug = articleSlug(url);
    const english = parseBlocks(contentHtml, "en");
    const urdu = parseBlocks(contentHtml, "ur");

    articles.push({
      slug,
      url,
      title,
      titles: {
        en: title,
        ur: localizedTitle(urdu, title),
      },
      author: cleanText(node.find("author name").first().text()),
      publishedAt: node.find("published").first().text(),
      updatedAt: node.find("updated").first().text(),
      imageUrl: images.get(slug) ?? null,
      content: { en: english, ur: urdu },
    });
  });

  if (articles.length === 0) {
    throw new Error("IR Farm did not return any readable blog articles");
  }

  return articles;
}

async function fetchText(url: string, signal: AbortSignal) {
  const response = await fetch(url, {
    headers: { Accept: "text/html,application/atom+xml" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`IR Farm request failed (${response.status})`);
  }

  return response.text();
}

export async function fetchLatestBlogs(): Promise<BlogSnapshot> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const [feed, listing] = await Promise.all([
      fetchText(IR_FARM_BLOG_FEED_URL, controller.signal),
      fetchText(IR_FARM_BLOG_URL, controller.signal),
    ]);

    return {
      articles: parseBlogFeed(feed, listing),
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("IR Farm took too long to respond");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
