import { PrismaClient, ContentStatus, PostContentFormat, PostStatus } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

interface ExtractedFaq {
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
    return {
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
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim() : "";

  const pMatch = rawHtml.match(/<p class="lead"[^>]*>([\s\S]*?)<\/p>/) || rawHtml.match(/<article[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
  const excerpt = pMatch ? pMatch[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim() : "";

  const badges = [...rawHtml.matchAll(/<span class="badge[^"]*"[^>]*>([\s\S]*?)<\/span>/g)].map((b) => b[1].replace(/<[^>]+>/g, "").trim());
  const categoryName = badges[0] || "Kerala SEO Guide";
  const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const tagName = badges[1] || "Pricing Transparency";
  const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return {
    post: {
      slug: "blog-cost-of-seo-kerala",
      title,
      excerpt,
      content: rawHtml,
      contentFormat: PostContentFormat.HTML,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-01-15T00:00:00.000Z"),
    },
    category: {
      slug: categorySlug,
      name: categoryName,
    },
    tag: {
      slug: tagSlug,
      name: tagName,
    },
  };
}

export async function main() {
  console.log("=== SEEDING DATABASE (IDEMPOTENT) ===");

  // 1. FAQs (serviceId null)
  const faqs = extractFaqs();
  for (const faq of faqs) {
    await prisma.faq.upsert({
      where: { question: faq.question },
      update: {
        answer: faq.answer,
        sortOrder: faq.sortOrder,
        status: faq.status,
        serviceId: faq.serviceId,
      },
      create: {
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

  const tag = await prisma.blogTag.upsert({
    where: { slug: blog.tag.slug },
    update: { name: blog.tag.name },
    create: { slug: blog.tag.slug, name: blog.tag.name },
  });

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

  // PostTag join
  await prisma.postTag.upsert({
    where: {
      postId_tagId: {
        postId: post.id,
        tagId: tag.id,
      },
    },
    update: {},
    create: {
      postId: post.id,
      tagId: tag.id,
    },
  });

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
      await prisma.$disconnect();
    });
}
