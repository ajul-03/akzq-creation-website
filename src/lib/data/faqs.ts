import { db } from "../db";
import { ContentStatus } from "@prisma/client";

export async function getFaqs(serviceId?: string | null) {
  return db.faq.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      ...(serviceId !== undefined ? { serviceId } : {}),
    },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      question: true,
      answer: true,
      sortOrder: true,
      serviceId: true,
      status: true,
    },
  });
}
