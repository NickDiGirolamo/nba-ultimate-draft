import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

interface SupportTicketRequestBody {
  categoryId?: unknown;
  categoryLabel?: unknown;
  impactId?: unknown;
  impactLabel?: unknown;
  replyEmail?: unknown;
  gameArea?: unknown;
  summary?: unknown;
  details?: unknown;
  includeDiagnostics?: unknown;
  diagnostics?: unknown;
}

const categoryLabels: Record<string, string> = {
  bug: "Bug or crash",
  "account-save": "Account or cloud save",
  "purchase-token": "Purchase or tokens",
  "progress-reward": "Progress or rewards",
  "balance-content": "Balance or player data",
  "feature-feedback": "Feature feedback",
  other: "Other support",
};

const impactLabels: Record<string, string> = {
  blocked: "Blocked",
  high: "High",
  medium: "Medium",
  low: "Low / idea",
};

const priorityByImpact: Record<string, string> = {
  blocked: "urgent",
  high: "high",
  medium: "normal",
  low: "low",
};

const defaultSupportNotifyTo = "Support@RogueHoops.com";
const defaultSupportNotifyFrom = "Rogue Hoops Support <Support@RogueHoops.com>";

const getRequiredEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const getTrimmedString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatDiagnostics = (diagnostics: Record<string, unknown>) =>
  JSON.stringify(diagnostics, null, 2);

const buildTicketEmailText = (ticketNumber: number, ticket: {
  categoryLabel: string;
  impactLabel: string;
  priority: string;
  replyEmail: string;
  gameArea: string;
  summary: string;
  details: string;
  diagnostics: Record<string, unknown>;
}) =>
  [
    `New Rogue Hoops support ticket #${ticketNumber}`,
    "",
    `Type: ${ticket.categoryLabel}`,
    `Impact: ${ticket.impactLabel}`,
    `Priority: ${ticket.priority}`,
    `Reply email: ${ticket.replyEmail}`,
    `Game area: ${ticket.gameArea}`,
    "",
    "Summary:",
    ticket.summary,
    "",
    "Details:",
    ticket.details,
    "",
    "Diagnostics:",
    formatDiagnostics(ticket.diagnostics),
  ].join("\n");

const buildTicketEmailHtml = (ticketNumber: number, ticket: {
  categoryLabel: string;
  impactLabel: string;
  priority: string;
  replyEmail: string;
  gameArea: string;
  summary: string;
  details: string;
  diagnostics: Record<string, unknown>;
}) => `
  <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
    <h1 style="margin:0 0 12px;font-size:22px">New Rogue Hoops support ticket #${ticketNumber}</h1>
    <table style="border-collapse:collapse;margin:0 0 18px;width:100%;max-width:720px">
      <tr><td style="padding:6px 0;font-weight:700">Type</td><td>${escapeHtml(ticket.categoryLabel)}</td></tr>
      <tr><td style="padding:6px 0;font-weight:700">Impact</td><td>${escapeHtml(ticket.impactLabel)}</td></tr>
      <tr><td style="padding:6px 0;font-weight:700">Priority</td><td>${escapeHtml(ticket.priority)}</td></tr>
      <tr><td style="padding:6px 0;font-weight:700">Reply email</td><td>${escapeHtml(ticket.replyEmail)}</td></tr>
      <tr><td style="padding:6px 0;font-weight:700">Game area</td><td>${escapeHtml(ticket.gameArea)}</td></tr>
    </table>
    <h2 style="font-size:16px;margin:18px 0 8px">Summary</h2>
    <p>${escapeHtml(ticket.summary)}</p>
    <h2 style="font-size:16px;margin:18px 0 8px">Details</h2>
    <p style="white-space:pre-wrap">${escapeHtml(ticket.details)}</p>
    <h2 style="font-size:16px;margin:18px 0 8px">Diagnostics</h2>
    <pre style="background:#f3f4f6;border-radius:10px;padding:12px;white-space:pre-wrap">${escapeHtml(formatDiagnostics(ticket.diagnostics))}</pre>
  </div>
`;

const sendSupportNotificationEmail = async (ticketId: string, ticketNumber: number, ticket: {
  categoryLabel: string;
  impactLabel: string;
  priority: string;
  replyEmail: string;
  gameArea: string;
  summary: string;
  details: string;
  diagnostics: Record<string, unknown>;
}) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { emailId: null, error: "Missing RESEND_API_KEY." };
  }

  const subject = `[Rogue Hoops #${ticketNumber}] ${ticket.categoryLabel}: ${ticket.summary}`.slice(0, 180);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `support-ticket-${ticketId}`,
    },
    body: JSON.stringify({
      from: Deno.env.get("SUPPORT_NOTIFY_FROM") ?? defaultSupportNotifyFrom,
      to: [Deno.env.get("SUPPORT_NOTIFY_TO") ?? defaultSupportNotifyTo],
      subject,
      text: buildTicketEmailText(ticketNumber, ticket),
      html: buildTicketEmailHtml(ticketNumber, ticket),
      reply_to: ticket.replyEmail,
      tags: [
        { name: "source", value: "feedback_modal" },
        { name: "category", value: ticket.categoryLabel.toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 64) },
      ],
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data && typeof data.message === "string"
        ? data.message
        : `Resend request failed with status ${response.status}.`;
    return { emailId: null, error: message };
  }

  const emailId =
    data && typeof data === "object" && "id" in data && typeof data.id === "string"
      ? data.id
      : null;

  return { emailId, error: null };
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const supabaseAnonKey = getRequiredEnv("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = request.headers.get("Authorization");

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    let user: { id: string; email?: string | null } | null = null;

    if (authorization) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authorization } },
      });
      const { data } = await userClient.auth.getUser();
      user = data.user ? { id: data.user.id, email: data.user.email } : null;
    }

    const body = (await request.json().catch(() => null)) as SupportTicketRequestBody | null;
    if (!body) {
      return jsonResponse({ error: "Missing support ticket payload." }, 400);
    }

    const categoryId = getTrimmedString(body.categoryId);
    const impactId = getTrimmedString(body.impactId);
    const replyEmail = getTrimmedString(body.replyEmail);
    const gameArea = getTrimmedString(body.gameArea);
    const summary = getTrimmedString(body.summary);
    const details = getTrimmedString(body.details);

    if (!categoryLabels[categoryId]) {
      return jsonResponse({ error: "Choose a valid ticket type." }, 400);
    }

    if (!impactLabels[impactId]) {
      return jsonResponse({ error: "Choose a valid impact level." }, 400);
    }

    if (!replyEmail || !isValidEmail(replyEmail)) {
      return jsonResponse({ error: "Enter a valid reply email." }, 400);
    }

    if (!gameArea || !summary || !details) {
      return jsonResponse({ error: "Complete the required support ticket fields." }, 400);
    }

    if (summary.length > 120) {
      return jsonResponse({ error: "Keep the ticket summary under 120 characters." }, 400);
    }

    if (details.length > 4000) {
      return jsonResponse({ error: "Keep the ticket details under 4,000 characters." }, 400);
    }

    const includeDiagnostics = body.includeDiagnostics === true;
    const diagnostics = includeDiagnostics && isPlainRecord(body.diagnostics) ? body.diagnostics : {};
    const priority = priorityByImpact[impactId] ?? "normal";

    const { data: ticket, error } = await adminClient
      .from("support_tickets")
      .insert({
        user_id: user?.id ?? null,
        account_email: user?.email ?? null,
        reply_email: replyEmail,
        category_id: categoryId,
        category_label: categoryLabels[categoryId],
        impact_id: impactId,
        impact_label: impactLabels[impactId],
        priority,
        game_area: gameArea,
        summary,
        details,
        diagnostics,
        source: "feedback_modal",
      })
      .select("id, ticket_number")
      .single();

    if (error || !ticket) {
      console.error("Unable to create support ticket", error);
      return jsonResponse({ error: "Unable to create support ticket." }, 500);
    }

    const ticketNumber = Number(ticket.ticket_number);
    const notification = await sendSupportNotificationEmail(ticket.id, ticketNumber, {
      categoryLabel: categoryLabels[categoryId],
      impactLabel: impactLabels[impactId],
      priority,
      replyEmail,
      gameArea,
      summary,
      details,
      diagnostics,
    });

    if (notification.error) {
      console.error("Unable to send support ticket notification", notification.error);
      await adminClient
        .from("support_tickets")
        .update({
          notification_error: notification.error,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticket.id);

      return jsonResponse({
        ticketId: ticket.id,
        ticketNumber,
        notificationSent: false,
      });
    }

    await adminClient
      .from("support_tickets")
      .update({
        notification_email_id: notification.emailId,
        notification_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    return jsonResponse({
      ticketId: ticket.id,
      ticketNumber,
      notificationSent: true,
    });
  } catch (error) {
    console.error("create-support-ticket failed", error);
    return jsonResponse({ error: "Unexpected support ticket error." }, 500);
  }
});
