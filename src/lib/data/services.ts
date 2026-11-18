import { db } from "../db";
import { ContentStatus } from "@prisma/client";

export async function getPublishedServices() {
  return db.service.findMany({
    where: { status: ContentStatus.PUBLISHED },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      shortDescription: true,
      sortOrder: true,
      iconKey: true,
      visualKey: true,
      status: true,
    },
  });
}

export async function getServiceBySlug(slug: string) {
  const normalizedSlug = slug.toLowerCase().trim();
  return db.service.findUnique({
    where: { slug: normalizedSlug },
    select: {
      id: true,
      slug: true,
      title: true,
      shortDescription: true,
      overview: true,
      seoTitle: true,
      metaDescription: true,
      iconKey: true,
      visualKey: true,
      status: true,
      items: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          kind: true,
          title: true,
          description: true,
          sortOrder: true,
        },
      },
    },
  });
}
