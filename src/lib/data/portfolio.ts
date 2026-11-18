import { db } from "../db";
import { ContentStatus } from "@prisma/client";

export interface GetPortfolioProjectsOptions {
  isConcept?: boolean;
}

export async function getPortfolioProjects(options?: GetPortfolioProjectsOptions) {
  return db.portfolioProject.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      ...(options?.isConcept !== undefined ? { isConcept: options.isConcept } : {}),
    },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      summary: true,
      tags: true,
      scope: true,
      isConcept: true,
      sortOrder: true,
      status: true,
    },
  });
}
