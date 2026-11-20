import { db } from "./db";

export interface LeadNotificationPayload {
  leadId: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  serviceInterest?: string | null;
  budgetRange?: string;
  message?: string | null;
}

/**
 * Dispatches an optional lead notification email via Resend if credentials exist.
 * Logs failures to ActivityLog under 'lead.notify_failed' with zero PII in metadata.
 */
export async function sendLeadNotification(payload: LeadNotificationPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  // If any required notification configuration is missing, keep notifications disabled
  if (!apiKey || !notifyEmail || !fromEmail) {
    return;
  }

  try {
    const cleanName = payload.name.replace(/[\x00-\x1F\x7F]/g, " ").trim().slice(0, 80);
    const cleanService = (payload.serviceInterest || "General Inquiry")
      .replace(/[\x00-\x1F\x7F]/g, " ")
      .trim()
      .slice(0, 80);

    const textBody = [
      "New Lead Received on AKZQ.Creation:",
      `- Lead ID: ${payload.leadId}`,
      `- Name: ${payload.name}`,
      `- Email: ${payload.email}`,
      `- Phone: ${payload.phone || "Not provided"}`,
      `- Company: ${payload.company || "Not provided"}`,
      `- Service: ${payload.serviceInterest || "General Inquiry"}`,
      `- Budget Range: ${payload.budgetRange || "UNSPECIFIED"}`,
      `- Message: ${payload.message || "No message provided"}`,
    ].join("\n");

    const baseUrl = process.env.RESEND_BASE_URL || "https://api.resend.com";
    const endpoint = `${baseUrl.replace(/\/$/, "")}/emails`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [notifyEmail],
        subject: `New Lead: ${cleanName} (${cleanService})`,
        text: textBody,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Resend API HTTP ${response.status}`);
    }
  } catch (err: unknown) {
    const statusMatch = err instanceof Error ? err.message.match(/HTTP \d+/) : null;
    const statusInfo = statusMatch ? statusMatch[0] : "network/timeout error";
    console.error(`sendLeadNotification error: ${statusInfo}`);

    try {
      await db.activityLog.create({
        data: {
          action: "lead.notify_failed",
          entityType: "Lead",
          entityId: payload.leadId,
          metadata: {
            error: "Notification dispatch failed",
          },
        },
      });
    } catch {
      // Protect from secondary failure
    }
  }
}
