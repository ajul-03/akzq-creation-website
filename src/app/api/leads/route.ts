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

// Rate limiting constants
const HOURLY_RATE_LIMIT = 5;
const DAILY_RATE_LIMIT = 20;
const UNKNOWN_IP_HOURLY_RATE_LIMIT = 2;
const UNKNOWN_IP_DAILY_RATE_LIMIT = 5;

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
    .regex(/^[\d\s+\-]{7,20}$/, "Invalid phone format")
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
  serviceInterest: z
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
    .max(200)
    .refine(noControlChars, { message: "Control characters are not allowed" })
    .nullable()
    .optional(),
  hp_field: z.string().optional(),
  elapsedMs: z.number().optional(),
});

function getClientIp(request: Request | NextRequest): {
  ip: string | null;
  isUnknown: boolean;
  identifier: string;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwarded ? forwarded.split(",")[0].trim() : null;
  const rawIp = firstForwardedIp || request.headers.get("x-real-ip") || null;
  const isUnknown = !rawIp;
  const identifier = isUnknown ? "unknown-client-ip" : rawIp;
  return { ip: rawIp, isUnknown, identifier };
}

function isAllowedOrigin(
  headerValue: string | null,
  siteUrlOrigin: string,
  allowedOriginsEnv?: string
): boolean {
  if (!headerValue) return true; // Direct clients / cURL with no origin header are permitted
  try {
    const parsedTarget = new URL(headerValue);
    const targetOrigin = parsedTarget.origin;
    if (!targetOrigin || targetOrigin === "null") return false;

    const allowedSet = new Set<string>();
    allowedSet.add(siteUrlOrigin);

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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    console.error("Configuration error: NEXT_PUBLIC_SITE_URL environment variable is missing.");
    return NextResponse.json(
      {
        ok: false,
        error: "Service temporarily unavailable. Please try again or reach us directly.",
      },
      { status: 503, headers: noStoreHeaders }
    );
  }

  let siteUrlOrigin: string;
  try {
    const parsedSiteUrl = new URL(siteUrl);
    if (!parsedSiteUrl.protocol || !parsedSiteUrl.host) {
      throw new Error("Invalid URL components");
    }
    siteUrlOrigin = parsedSiteUrl.origin;
  } catch (err) {
    console.error(`Configuration error: NEXT_PUBLIC_SITE_URL is invalid ('${siteUrl}'):`, err);
    return NextResponse.json(
      {
        ok: false,
        error: "Service temporarily unavailable. Please try again or reach us directly.",
      },
      { status: 503, headers: noStoreHeaders }
    );
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const targetHeader = origin || referer;
  if (!isAllowedOrigin(targetHeader, siteUrlOrigin, process.env.ALLOWED_ORIGINS)) {
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

  // 6. Honeypot check: silently accept without inserting (201 Created)
  if (payload.hp_field && payload.hp_field.trim().length > 0) {
    return NextResponse.json(
      { ok: true },
      { status: 201, headers: noStoreHeaders }
    );
  }

  // 7. Fast submission check (< 2000ms): silently accept without inserting (201 Created)
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
  const { isUnknown: isUnknownIp, identifier: clientIdentifier } = getClientIp(request);
  const ipHash = hashIp(clientIdentifier, secret);

  try {
    // 9. Service validation against published Services in DB
    const requestedService = payload.service || payload.serviceInterest;
    let serviceRecord: { id: string; title: string; slug: string } | null = null;
    if (requestedService && requestedService.trim().length > 0) {
      const serviceInput = requestedService.trim();

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
    // Stricter limits for unknown IP bucket: UNKNOWN_IP_HOURLY_RATE_LIMIT/hour, UNKNOWN_IP_DAILY_RATE_LIMIT/day
    // Standard limits for known IP: HOURLY_RATE_LIMIT/hour, DAILY_RATE_LIMIT/day
    const hourlyLimit = isUnknownIp ? UNKNOWN_IP_HOURLY_RATE_LIMIT : HOURLY_RATE_LIMIT;
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

    const dailyLimit = isUnknownIp ? UNKNOWN_IP_DAILY_RATE_LIMIT : DAILY_RATE_LIMIT;
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

    // 11. Deduplication: same email + same message within 10 minutes (201 Created)
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
    // NOTE: serviceInterest strictly comes from verified database Service row, never from client text
    const lead = await db.lead.create({
      data: {
        source: "CONTACT_FORM",
        name: payload.name,
        email: payload.email,
        phone: payload.phone || null,
        company: payload.company || null,
        serviceId: serviceRecord ? serviceRecord.id : null,
        serviceInterest: serviceRecord ? serviceRecord.title : null,
        budgetRange,
        message: payload.message || null,
        utmSource: utmSource ? utmSource.slice(0, 200) : null,
        utmMedium: utmMedium ? utmMedium.slice(0, 200) : null,
        utmCampaign: utmCampaign ? utmCampaign.slice(0, 200) : null,
        referrer: sanitizedReferrer ? sanitizedReferrer.slice(0, 200) : null,
        ipHash,
        userAgent,
        consentGivenAt: new Date(),
        status: "NEW",
      },
    });

    // 13. Create ActivityLog entry (ZERO client-supplied text in metadata)
    await db.activityLog.create({
      data: {
        action: "lead.created",
        entityType: "Lead",
        entityId: lead.id,
        ipHash,
        metadata: {
          source: "CONTACT_FORM",
          serviceInterest: serviceRecord ? serviceRecord.title : null,
          hasPhone: Boolean(payload.phone),
          budgetRange,
        },
      },
    });

    // 14. Optional email notification via after()
    if (
      process.env.RESEND_API_KEY &&
      process.env.LEAD_NOTIFICATION_TO &&
      process.env.LEAD_NOTIFICATION_FROM
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
