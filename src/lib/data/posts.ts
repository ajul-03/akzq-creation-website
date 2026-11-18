import { db } from "../db";
import { PostStatus } from "@prisma/client";

export async function getPublishedPosts() {
  return db.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      contentFormat: true,
      publishedAt: true,
      readingTimeMinutes: true,
      seoTitle: true,
      metaDescription: true,
      category: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
      postTags: {
        select: {
          tag: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function getPostBySlug(slug: string) {
  const normalizedSlug = slug.toLowerCase().trim();
  return db.post.findUnique({
    where: { slug: normalizedSlug },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      contentFormat: true,
      publishedAt: true,
      readingTimeMinutes: true,
      seoTitle: true,
      metaDescription: true,
      canonicalUrl: true,
      category: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
      postTags: {
        select: {
          tag: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
        },
      },
    },
  });
}
