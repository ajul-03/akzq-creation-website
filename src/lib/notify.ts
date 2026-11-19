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

  if (!apiKey || !notifyEmail) {
    return;
  }

  try {
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

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "leads@akzqcreation.com",
        to: [notifyEmail],
        subject: `New Lead: ${payload.name} (${payload.serviceInterest || "General Inquiry"})`,
        text: textBody,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Resend API HTTP ${response.status}: ${errText}`);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Notification dispatch failed";
    console.error("sendLeadNotification error:", errorMsg);

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
