import { PrismaClient, ContentStatus, PostContentFormat, PostStatus } from "@prisma/client";
import fs from "fs";
import path from "path";

let defaultPrisma: PrismaClient | null = null;
function getPrisma(client?: PrismaClient): PrismaClient {
  if (client) return client;
  if (!defaultPrisma) {
    defaultPrisma = new PrismaClient();
  }
  return defaultPrisma;
}

interface ExtractedFaq {
  seedKey: string;
  question: string;
  answer: string;
  sortOrder: number;
  status: ContentStatus;
  serviceId: string | null;
}

interface ExtractedPortfolio {
  slug: string;
  title: string;
  category: string;
  summary: string;
  tags: string[];
  scope: {
    challenge: string;
    solution: string;
    deliverables: string[];
  };
  isConcept: boolean;
  status: ContentStatus;
  sortOrder: number;
}

interface ExtractedService {
  slug: string;
  title: string;
  shortDescription: string;
  status: ContentStatus;
  sortOrder: number;
}

function extractFaqs(): ExtractedFaq[] {
  const fileStr = fs.readFileSync(path.resolve("src/app/faq/page.tsx"), "utf8");
  const match = fileStr.match(/dangerouslySetInnerHTML=\{\{\s*__html:\s*("[\s\S]*?")\s*\}\}/);
  if (!match) throw new Error("Could not find FAQ main HTML");
  const rawHtml = JSON.parse(match[1]);
  const itemRegex = /<div class="faq-item[^"]*">[\s\S]*?<button class="faq-question"[^>]*>([\s\S]*?)<\/button>[\s\S]*?<div class="faq-answer">([\s\S]*?)<\/div>\s*<\/div>/g;
  const items = [...rawHtml.matchAll(itemRegex)];
  return items.map((m, idx) => {
    const rawQ = m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
    const question = rawQ.replace(/^\d+\.\s*/, "");
    const answer = m[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    const seedKey = `faq-${idx + 1}`;
    return {
      seedKey,
      question,
      answer,
      sortOrder: idx + 1,
      status: ContentStatus.PUBLISHED,
      serviceId: null,
    };
  });
}

function extractPortfolio(): ExtractedPortfolio[] {
  const fileStr = fs.readFileSync(path.resolve("src/app/portfolio/page.tsx"), "utf8");
  const match = fileStr.match(/dangerouslySetInnerHTML=\{\{\s*__html:\s*("[\s\S]*?")\s*\}\}/);
  if (!match) throw new Error("Could not find portfolio main HTML");
  const rawHtml = JSON.parse(match[1]);

  const cardRegex = /<div class="portfolio-card"[^>]*data-category="([^"]*)"[\s\S]*?<div class="portfolio-category">([\s\S]*?)<\/div>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>[\s\S]*?<a[^>]*class="[^"]*view-case-study-btn"[^>]*data-title="([^"]*)"[^>]*data-category-name="([^"]*)"[^>]*data-challenge="([^"]*)"[^>]*data-solution="([^"]*)"[^>]*data-deliverables="([^"]*)"/g;

  const cards = [...rawHtml.matchAll(cardRegex)];
  return cards.map((c, idx) => {
    const title = c[3].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const category = c[2].replace(/&amp;/g, "&").trim();
    const summary = c[4].replace(/&amp;/g, "&").trim();
    const deliverables = c[9].split("|").map((s: string) => s.trim());
    return {
      slug,
      title,
      category,
      summary,
      tags: [c[1], category],
      scope: {
        challenge: c[7],
        solution: c[8],
        deliverables,
      },
      isConcept: true,
      status: ContentStatus.PUBLISHED,
      sortOrder: idx + 1,
    };
  });
}

function extractServices(): ExtractedService[] {
  const fileStr = fs.readFileSync(path.resolve("src/app/services/page.tsx"), "utf8");
  const match = fileStr.match(/dangerouslySetInnerHTML=\{\{\s*__html:\s*("[\s\S]*?")\s*\}\}/);
  if (!match) throw new Error("Could not find services main HTML");
  const rawHtml = JSON.parse(match[1]);

  const cards = [...rawHtml.matchAll(/<div class="service-card"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>[\s\S]*?<a[^>]*href="\/([^"]*)"/g)];
  const navOrder = [
    "branding-identity",
    "web-design-development",
    "digital-marketing-seo",
    "media-content-production",
    "local-seo",
  ];

  const services: ExtractedService[] = [];
  navOrder.forEach((slug, idx) => {
    const card = cards.find((c) => c[3].replace(/^\//, "") === slug);
    if (!card) throw new Error(`Missing service card for ${slug}`);
    services.push({
      slug,
      title: card[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim(),
      shortDescription: card[2].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim(),
      status: ContentStatus.PUBLISHED,
      sortOrder: idx + 1,
    });
  });
  return services;
}

function extractBlog() {
  const fileStr = fs.readFileSync(path.resolve("src/app/blog-cost-of-seo-kerala/page.tsx"), "utf8");
  const match = fileStr.match(/dangerouslySetInnerHTML=\{\{\s*__html:\s*("[\s\S]*?")\s*\}\}/);
  if (!match) throw new Error("Could not find blog main HTML");
  const rawHtml = JSON.parse(match[1]);

  const titleMatch = rawHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (!titleMatch) throw new Error("Failed to extract blog title from page");
  const title = titleMatch[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();

  const pMatch = rawHtml.match(/<p class="lead"[^>]*>([\s\S]*?)<\/p>/) || rawHtml.match(/<article[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
  if (!pMatch) throw new Error("Failed to extract blog excerpt from page");
  const excerpt = pMatch[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();

  // Extract badges directly from rendered HTML — no hardcoded fallback strings
  const badges = [...rawHtml.matchAll(/<span class="badge[^"]*"[^>]*>([\s\S]*?)<\/span>/g)].map((b) => b[1].replace(/<[^>]+>/g, "").trim());
  if (badges.length === 0) throw new Error("Failed to extract badges from blog page");

  // Primary badge maps to category, secondary badge maps to tag
  const categoryName = badges[0];
  const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  let tagData: { slug: string; name: string } | null = null;
  if (badges[1]) {
    const tagName = badges[1];
    const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    tagData = { slug: tagSlug, name: tagName };
  }

  // Legacy blog HTML does not specify a publication date (datesFound: null, timeTags: null)
  // Therefore publishedAt is set to null (no invented dates)
  const publishedAt: Date | null = null;

  return {
    post: {
      slug: "blog-cost-of-seo-kerala",
      title,
      excerpt,
      content: rawHtml,
      contentFormat: PostContentFormat.HTML,
      status: PostStatus.PUBLISHED,
      publishedAt,
    },
    category: {
      slug: categorySlug,
      name: categoryName,
    },
    tag: tagData,
  };
}

export async function main(client?: PrismaClient) {
  const prisma = getPrisma(client);
  console.log("=== SEEDING DATABASE (IDEMPOTENT) ===");

  // 1. FAQs (serviceId null, upserted by seedKey)
  const faqs = extractFaqs();
  for (const faq of faqs) {
    await prisma.faq.upsert({
      where: { seedKey: faq.seedKey },
      update: {
        question: faq.question,
        answer: faq.answer,
        sortOrder: faq.sortOrder,
        status: faq.status,
        serviceId: faq.serviceId,
      },
      create: {
        seedKey: faq.seedKey,
        question: faq.question,
        answer: faq.answer,
        sortOrder: faq.sortOrder,
        status: faq.status,
        serviceId: faq.serviceId,
      },
    });
  }

  // 2. Services (5 services, nav order, no invented items/overview)
  const services = extractServices();
  for (const s of services) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {
        title: s.title,
        shortDescription: s.shortDescription,
        status: s.status,
        sortOrder: s.sortOrder,
      },
      create: {
        slug: s.slug,
        title: s.title,
        shortDescription: s.shortDescription,
        status: s.status,
        sortOrder: s.sortOrder,
      },
    });
  }

  // 3. Portfolio Projects (6 projects, isConcept true)
  const projects = extractPortfolio();
  for (const p of projects) {
    await prisma.portfolioProject.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        category: p.category,
        summary: p.summary,
        tags: p.tags,
        scope: p.scope,
        isConcept: p.isConcept,
        status: p.status,
        sortOrder: p.sortOrder,
      },
      create: {
        slug: p.slug,
        title: p.title,
        category: p.category,
        summary: p.summary,
        tags: p.tags,
        scope: p.scope,
        isConcept: p.isConcept,
        status: p.status,
        sortOrder: p.sortOrder,
      },
    });
  }

  // 4. Blog Post, Category, Tag
  const blog = extractBlog();
  const category = await prisma.blogCategory.upsert({
    where: { slug: blog.category.slug },
    update: { name: blog.category.name },
    create: { slug: blog.category.slug, name: blog.category.name },
  });

  let tagId: string | null = null;
  if (blog.tag) {
    const tag = await prisma.blogTag.upsert({
      where: { slug: blog.tag.slug },
      update: { name: blog.tag.name },
      create: { slug: blog.tag.slug, name: blog.tag.name },
    });
    tagId = tag.id;
  }

  const post = await prisma.post.upsert({
    where: { slug: blog.post.slug },
    update: {
      title: blog.post.title,
      excerpt: blog.post.excerpt,
      content: blog.post.content,
      contentFormat: blog.post.contentFormat,
      status: blog.post.status,
      publishedAt: blog.post.publishedAt,
      categoryId: category.id,
    },
    create: {
      slug: blog.post.slug,
      title: blog.post.title,
      excerpt: blog.post.excerpt,
      content: blog.post.content,
      contentFormat: blog.post.contentFormat,
      status: blog.post.status,
      publishedAt: blog.post.publishedAt,
      categoryId: category.id,
    },
  });

  // PostTag join only if tag exists
  if (tagId) {
    await prisma.postTag.upsert({
      where: {
        postId_tagId: {
          postId: post.id,
          tagId,
        },
      },
      update: {},
      create: {
        postId: post.id,
        tagId,
      },
    });
  }

  // Query table row counts
  const [
    faqCount,
    serviceCount,
    projectCount,
    catCount,
    tagCount,
    postCount,
    postTagCount,
    userCount,
  ] = await Promise.all([
    prisma.faq.count(),
    prisma.service.count(),
    prisma.portfolioProject.count(),
    prisma.blogCategory.count(),
    prisma.blogTag.count(),
    prisma.post.count(),
    prisma.postTag.count(),
    prisma.user.count(),
  ]);

  console.log("Seeding completed successfully.");
  console.log("Row counts per table:");
  console.table({
    Faq: faqCount,
    Service: serviceCount,
    PortfolioProject: projectCount,
    BlogCategory: catCount,
    BlogTag: tagCount,
    Post: postCount,
    PostTag: postTagCount,
    User: userCount,
  });
}

if (process.argv[1] && process.argv[1].endsWith("seed.ts")) {
  main()
    .catch((e) => {
      console.error("Seed error:", e);
      process.exit(1);
    })
    .finally(async () => {
      if (defaultPrisma) await defaultPrisma.$disconnect();
    });
}
