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

const LeadInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(254, "Email cannot exceed 254 characters")
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9\s\-()]+$/, "Invalid phone format")
    .min(7, "Phone number is too short")
    .max(20, "Phone number is too long")
    .nullable()
    .optional(),
  company: z
    .string()
    .trim()
    .max(120, "Company name cannot exceed 120 characters")
    .nullable()
    .optional(),
  service: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional(),
  budgetRange: z
    .string()
    .trim()
    .max(50)
    .nullable()
    .optional(),
  message: z
    .string()
    .trim()
    .max(2000, "Message cannot exceed 2000 characters")
    .nullable()
    .optional(),
  utmSource: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .optional(),
  utmMedium: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .optional(),
  utmCampaign: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .optional(),
  utmTerm: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .optional(),
  utmContent: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .optional(),
  referrer: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional(),
  hp_field: z.string().optional(),
  elapsedMs: z.number().optional(),
});

function isAllowedOrigin(urlStr: string, siteUrl: string): boolean {
  if (!urlStr) return false;
  try {
    const parsed = new URL(urlStr);
    const originBase = `${parsed.protocol}//${parsed.host}`;
    const siteBase = new URL(siteUrl).origin;
    if (originBase === siteBase) return true;
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return process.env.NODE_ENV !== "production";
    }
    return false;
  } catch {
    return false;
  }
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
  if (targetHeader && !isAllowedOrigin(targetHeader, siteUrl)) {
    return NextResponse.json(
      { ok: false, error: "Forbidden: Origin or Referer not allowed" },
      { status: 403, headers: noStoreHeaders }
    );
  }

  // 3. Rejection: Body > 10KB (413)
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to read request payload" },
      { status: 400, headers: noStoreHeaders }
    );
  }

  if (rawBody.length > 10 * 1024) {
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

  // Extract client IP and hash via HMAC
  const forwarded = request.headers.get("x-forwarded-for");
  const rawIp =
    (forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip")) ||
    "127.0.0.1";
  const ipHash = hashIp(rawIp);

  try {
    // 8. Service validation against published Services in DB
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
              error: `Invalid service '${serviceInput}'. Must match a published service.`,
            },
            { status: 400, headers: noStoreHeaders }
          );
        }
      }
    }

    // 9. Rate limiting: max 5 requests / hour, max 20 requests / day per ipHash
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourCount = await db.lead.count({
      where: {
        ipHash,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (hourCount >= 5) {
      return NextResponse.json(
        {
          ok: false,
          error: "Too many submissions. Please try again later or reach us directly.",
        },
        {
          status: 429,
          headers: {
            ...noStoreHeaders,
            "Retry-After": "3600",
          },
        }
      );
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dayCount = await db.lead.count({
      where: {
        ipHash,
        createdAt: { gte: oneDayAgo },
      },
    });

    if (dayCount >= 20) {
      return NextResponse.json(
        {
          ok: false,
          error: "Too many submissions. Please try again later or reach us directly.",
        },
        {
          status: 429,
          headers: {
            ...noStoreHeaders,
            "Retry-After": "86400",
          },
        }
      );
    }

    // 10. Deduplication: same email + same message within 10 minutes
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

    // Fallback extraction for UTMs and Referrer
    const requestUrl = new URL(request.url);
    const utmSource =
      payload.utmSource || requestUrl.searchParams.get("utm_source") || null;
    const utmMedium =
      payload.utmMedium || requestUrl.searchParams.get("utm_medium") || null;
    const utmCampaign =
      payload.utmCampaign || requestUrl.searchParams.get("utm_campaign") || null;
    const resolvedReferrer =
      payload.referrer || request.headers.get("referer") || null;

    const budgetRange = mapBudgetRange(payload.budgetRange);
    const userAgent = request.headers.get("user-agent")?.slice(0, 255) || null;

    // 11. Storage: Create Lead record
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
        referrer: resolvedReferrer ? resolvedReferrer.slice(0, 500) : null,
        ipHash,
        userAgent,
        consentGivenAt: new Date(),
        status: "NEW",
      },
    });

    // 12. Create ActivityLog entry (ZERO PII in metadata)
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

    // 13. Optional email notification via after()
    if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
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
