import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashIp } from "@/lib/privacy";
import { sendLeadNotification } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

const noControlChars = (val?: string | null) =>
  !val || !/[\x00-\x1F\x7F]/.test(val);

const LeadInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .refine(noControlChars, { message: "Control characters are not allowed" }),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(254, "Email cannot exceed 254 characters")
    .toLowerCase()
    .refine(noControlChars, { message: "Control characters are not allowed" }),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9\s\-()]+$/, "Invalid phone format")
    .min(7, "Phone number is too short")
    .max(20, "Phone number is too long")
    .refine(noControlChars, { message: "Control characters are not allowed" })
    .nullable()
    .optional(),
  company: z
    .string()
    .trim()
    .max(120, "Company name cannot exceed 120 characters")
    .refine(noControlChars, { message: "Control characters are not allowed" })
    .nullable()
    .optional(),
  service: z
    .string()
    .trim()
    .max(100)
    .refine(noControlChars, { message: "Control characters are not allowed" })
    .nullable()
    .optional(),
  budgetRange: z
    .string()
    .trim()
    .max(50)
    .refine(noControlChars, { message: "Control characters are not allowed" })
    .nullable()
    .optional(),
  message: z
    .string()
    .trim()
    .max(2000, "Message cannot exceed 2000 characters")
    .transform((val) =>
      val
        ? val
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, "")
        : val
    )
    .nullable()
    .optional(),
  utmSource: z
    .string()
    .trim()
    .max(200)
    .refine(noControlChars, { message: "Control characters are not allowed" })
    .nullable()
    .optional(),
  utmMedium: z
    .string()
    .trim()
    .max(200)
    .refine(noControlChars, { message: "Control characters are not allowed" })
    .nullable()
    .optional(),
  utmCampaign: z
    .string()
    .trim()
    .max(200)
    .refine(noControlChars, { message: "Control characters are not allowed" })
    .nullable()
    .optional(),
  utmTerm: z
    .string()
    .trim()
    .max(200)
    .refine(noControlChars, { message: "Control characters are not allowed" })
    .nullable()
    .optional(),
  utmContent: z
    .string()
    .trim()
    .max(200)
    .refine(noControlChars, { message: "Control characters are not allowed" })
    .nullable()
    .optional(),
  referrer: z
    .string()
    .trim()
    .max(500)
    .refine(noControlChars, { message: "Control characters are not allowed" })
    .nullable()
    .optional(),
  hp_field: z.string().optional(),
  elapsedMs: z.number().optional(),
});

function isAllowedOrigin(
  headerValue: string | null,
  siteUrl: string,
  allowedOriginsEnv?: string
): boolean {
  if (!headerValue) return true; // Direct clients / cURL with no origin header are permitted
  try {
    const parsedTarget = new URL(headerValue);
    const targetOrigin = parsedTarget.origin;
    if (!targetOrigin || targetOrigin === "null") return false;

    const allowedSet = new Set<string>();
    try {
      allowedSet.add(new URL(siteUrl).origin);
    } catch {}

    if (allowedOriginsEnv) {
      for (const item of allowedOriginsEnv.split(",")) {
        const trimmed = item.trim();
        if (trimmed) {
          try {
            allowedSet.add(new URL(trimmed).origin);
          } catch {}
        }
      }
    }

    return allowedSet.has(targetOrigin);
  } catch {
    return false;
  }
}

async function readBodyWithLimit(
  request: NextRequest,
  maxBytes: number
): Promise<{ body: string; exceeded: boolean }> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    return { body: "", exceeded: true };
  }

  if (!request.body) {
    const text = await request.text();
    return { body: text, exceeded: text.length > maxBytes };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.length;
        if (totalBytes > maxBytes) {
          await reader.cancel();
          return { body: "", exceeded: true };
        }
        chunks.push(value);
      }
    }
  } catch {
    return { body: "", exceeded: true };
  }

  const concatenated = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    concatenated.set(chunk, offset);
    offset += chunk.length;
  }

  return { body: new TextDecoder().decode(concatenated), exceeded: false };
}

function mapBudgetRange(
  budget?: string | null
): "STARTER" | "GROWTH" | "CUSTOM" | "UNSPECIFIED" {
  if (!budget) return "UNSPECIFIED";
  const lower = budget.toLowerCase();
  if (lower.includes("starter") || lower.includes("15k")) return "STARTER";
  if (lower.includes("growth") || lower.includes("30k")) return "GROWTH";
  if (
    lower.includes("custom") ||
    lower.includes("scale") ||
    lower.includes("enterprise") ||
    lower.includes("60k")
  ) {
    return "CUSTOM";
  }
  return "UNSPECIFIED";
}

export async function POST(request: NextRequest) {
  // 1. Rejection: Content-Type must be application/json (415)
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { ok: false, error: "Unsupported Media Type: application/json required" },
      { status: 415, headers: noStoreHeaders }
    );
  }

  // 2. Rejection: Origin / Referer check (403)
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://akzqcreation.com";
  const targetHeader = origin || referer;
  if (!isAllowedOrigin(targetHeader, siteUrl, process.env.ALLOWED_ORIGINS)) {
    return NextResponse.json(
      { ok: false, error: "Forbidden: Origin or Referer not allowed" },
      { status: 403, headers: noStoreHeaders }
    );
  }

  // 3. Rejection: Body > 10KB (413) with stream reader cap
  const { body: rawBody, exceeded } = await readBodyWithLimit(request, 10 * 1024);
  if (exceeded) {
    return NextResponse.json(
      { ok: false, error: "Payload Too Large: body exceeds 10KB" },
      { status: 413, headers: noStoreHeaders }
    );
  }

  // 4. JSON parsing
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON format" },
      { status: 400, headers: noStoreHeaders }
    );
  }

  // 5. Payload validation via Zod
  const validation = LeadInputSchema.safeParse(parsedJson);
  if (!validation.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      },
      { status: 400, headers: noStoreHeaders }
    );
  }

  const payload = validation.data;

  // 6. Honeypot check: silently accept without inserting
  if (payload.hp_field && payload.hp_field.trim().length > 0) {
    return NextResponse.json(
      { ok: true },
      { status: 201, headers: noStoreHeaders }
    );
  }

  // 7. Fast submission check (< 2000ms): silently accept without inserting
  if (typeof payload.elapsedMs === "number" && payload.elapsedMs < 2000) {
    return NextResponse.json(
      { ok: true },
      { status: 201, headers: noStoreHeaders }
    );
  }

  // 8. Runtime Secret Validation: IP_HASH_SECRET must be set and >= 32 chars, not starting with "replace-with"
  const secret = process.env.IP_HASH_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith("replace-with")) {
    console.error("Configuration error: IP_HASH_SECRET is missing, under 32 characters, or using placeholder");
    return NextResponse.json(
      {
        ok: false,
        error: "Service temporarily unavailable. Please try again or reach us directly.",
      },
      { status: 503, headers: noStoreHeaders }
    );
  }

  // Extract client IP and hash via HMAC; use shared "unknown" bucket if IP missing
  const forwarded = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwarded ? forwarded.split(",")[0].trim() : null;
  const rawIp = firstForwardedIp || request.headers.get("x-real-ip");
  const isUnknownIp = !rawIp;
  const clientIdentifier = isUnknownIp ? "unknown-client-ip" : rawIp;
  const ipHash = hashIp(clientIdentifier, secret);

  try {
    // 9. Service validation against published Services in DB
    let serviceRecord: { id: string; title: string; slug: string } | null = null;
    if (payload.service && payload.service.trim().length > 0) {
      const serviceInput = payload.service.trim();

      const serviceSlugMap: Record<string, string> = {
        "branding-identity": "branding-identity",
        "branding & identity": "branding-identity",
        "web-design-development": "web-design-development",
        "web design & development": "web-design-development",
        "digital-marketing-seo": "digital-marketing-seo",
        "digital marketing & seo": "digital-marketing-seo",
        "media-content-production": "media-content-production",
        "media & content production": "media-content-production",
        "local-seo": "local-seo",
        "local seo": "local-seo",
        "local seo (google maps dominance)": "local-seo",
      };

      const resolvedSlug = serviceSlugMap[serviceInput.toLowerCase()] || serviceInput;
      serviceRecord = await db.service.findFirst({
        where: {
          OR: [
            { slug: resolvedSlug },
            { slug: serviceInput },
            { title: { equals: serviceInput, mode: "insensitive" } },
          ],
          status: "PUBLISHED",
        },
        select: { id: true, title: true, slug: true },
      });

      if (!serviceRecord) {
        const lowerInput = serviceInput.toLowerCase();
        if (
          lowerInput.includes("multi-service") ||
          lowerInput.includes("package") ||
          lowerInput.includes("custom package")
        ) {
          serviceRecord = null;
        } else {
          return NextResponse.json(
            {
              ok: false,
              error: "Invalid service selection. Please choose a published service.",
            },
            { status: 400, headers: noStoreHeaders }
          );
        }
      }
    }

    // 10. Rate limiting:
    // Stricter limits for unknown IP bucket: 2/hour, 5/day
    // Standard limits for known IP: 5/hour, 20/day
    const hourlyLimit = isUnknownIp ? 2 : 5;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourCount = await db.lead.count({
      where: {
        ipHash,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (hourCount >= hourlyLimit) {
      const oldestInHour = await db.lead.findFirst({
        where: { ipHash, createdAt: { gte: oneHourAgo } },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      });
      const retryAfterSeconds = oldestInHour
        ? Math.max(1, Math.ceil((oldestInHour.createdAt.getTime() + 60 * 60 * 1000 - Date.now()) / 1000))
        : 3600;

      return NextResponse.json(
        {
          ok: false,
          error: "Too many submissions. Please try again later or reach us directly.",
        },
        {
          status: 429,
          headers: {
            ...noStoreHeaders,
            "Retry-After": String(retryAfterSeconds),
          },
        }
      );
    }

    const dailyLimit = isUnknownIp ? 5 : 20;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dayCount = await db.lead.count({
      where: {
        ipHash,
        createdAt: { gte: oneDayAgo },
      },
    });

    if (dayCount >= dailyLimit) {
      const oldestInDay = await db.lead.findFirst({
        where: { ipHash, createdAt: { gte: oneDayAgo } },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      });
      const retryAfterSeconds = oldestInDay
        ? Math.max(1, Math.ceil((oldestInDay.createdAt.getTime() + 24 * 60 * 60 * 1000 - Date.now()) / 1000))
        : 86400;

      return NextResponse.json(
        {
          ok: false,
          error: "Too many submissions. Please try again later or reach us directly.",
        },
        {
          status: 429,
          headers: {
            ...noStoreHeaders,
            "Retry-After": String(retryAfterSeconds),
          },
        }
      );
    }

    // 11. Deduplication: same email + same message within 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existingDuplicate = await db.lead.findFirst({
      where: {
        email: payload.email,
        message: payload.message ?? null,
        createdAt: { gte: tenMinutesAgo },
      },
      select: { id: true },
    });

    if (existingDuplicate) {
      return NextResponse.json(
        { ok: true },
        { status: 201, headers: noStoreHeaders }
      );
    }

    // Fallback extraction for UTMs and Referrer (origin+pathname only, strip query/hash, null if empty)
    const requestUrl = new URL(request.url);
    const utmSource =
      payload.utmSource || requestUrl.searchParams.get("utm_source") || null;
    const utmMedium =
      payload.utmMedium || requestUrl.searchParams.get("utm_medium") || null;
    const utmCampaign =
      payload.utmCampaign || requestUrl.searchParams.get("utm_campaign") || null;

    let sanitizedReferrer: string | null = null;
    if (payload.referrer && payload.referrer.trim().length > 0) {
      try {
        const refUrl = new URL(payload.referrer.trim());
        sanitizedReferrer = `${refUrl.origin}${refUrl.pathname}`;
      } catch {
        sanitizedReferrer = null;
      }
    }

    const budgetRange = mapBudgetRange(payload.budgetRange);
    const userAgent = request.headers.get("user-agent")?.slice(0, 255) || null;

    // 12. Storage: Create Lead record
    const lead = await db.lead.create({
      data: {
        source: "CONTACT_FORM",
        name: payload.name,
        email: payload.email,
        phone: payload.phone || null,
        company: payload.company || null,
        serviceId: serviceRecord?.id || null,
        serviceInterest: serviceRecord?.title || payload.service || null,
        budgetRange,
        message: payload.message || null,
        utmSource: utmSource ? utmSource.slice(0, 200) : null,
        utmMedium: utmMedium ? utmMedium.slice(0, 200) : null,
        utmCampaign: utmCampaign ? utmCampaign.slice(0, 200) : null,
        referrer: sanitizedReferrer ? sanitizedReferrer.slice(0, 500) : null,
        ipHash,
        userAgent,
        consentGivenAt: new Date(),
        status: "NEW",
      },
    });

    // 13. Create ActivityLog entry (ZERO PII in metadata)
    await db.activityLog.create({
      data: {
        action: "lead.created",
        entityType: "Lead",
        entityId: lead.id,
        ipHash,
        metadata: {
          source: "CONTACT_FORM",
          hasPhone: Boolean(payload.phone),
          budgetRange,
        },
      },
    });

    // 14. Optional email notification via after()
    if (
      process.env.RESEND_API_KEY &&
      process.env.NOTIFY_EMAIL &&
      process.env.RESEND_FROM_EMAIL
    ) {
      after(async () => {
        await sendLeadNotification({
          leadId: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          serviceInterest: lead.serviceInterest,
          budgetRange: lead.budgetRange,
          message: lead.message,
        });
      });
    }

    return NextResponse.json(
      { ok: true },
      { status: 201, headers: noStoreHeaders }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Lead submission database error:", errorMsg);

    return NextResponse.json(
      {
        ok: false,
        error:
          "Service temporarily unavailable. Please try again or reach us directly.",
      },
      { status: 503, headers: noStoreHeaders }
    );
  }
}
