import { publicSupabaseAnonKey, publicSupabaseUrl, supabase } from "./supabase";

const SUPPORT_TICKET_REQUEST_TIMEOUT_MS = 8000;

export interface SupportTicketPayload {
  categoryId: string;
  categoryLabel: string;
  impactId: string;
  impactLabel: string;
  replyEmail: string;
  gameArea: string;
  summary: string;
  details: string;
  includeDiagnostics: boolean;
  diagnostics: Record<string, unknown>;
}

export interface SupportTicketResult {
  ticketId: string | null;
  ticketNumber: number | null;
  error: string | null;
}

export const createSupportTicket = async (ticket: SupportTicketPayload): Promise<SupportTicketResult> => {
  try {
    if (!publicSupabaseUrl || !publicSupabaseAnonKey) {
      return { ticketId: null, ticketNumber: null, error: "Support ticket intake is not configured." };
    }

    const {
      data: { session },
    } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), SUPPORT_TICKET_REQUEST_TIMEOUT_MS);
    const response = await fetch(`${publicSupabaseUrl}/functions/v1/create-support-ticket`, {
      method: "POST",
      headers: {
        apikey: publicSupabaseAnonKey,
        Authorization: `Bearer ${session?.access_token ?? publicSupabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ticket),
      signal: controller.signal,
    }).finally(() => {
      window.clearTimeout(timeoutId);
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data && typeof data === "object" && "error" in data && typeof data.error === "string"
          ? data.error
          : `Support ticket request failed with status ${response.status}.`;
      return { ticketId: null, ticketNumber: null, error: message };
    }

    const ticketId =
      data && typeof data === "object" && "ticketId" in data && typeof data.ticketId === "string"
        ? data.ticketId
        : null;
    const rawTicketNumber =
      data && typeof data === "object" && "ticketNumber" in data
        ? data.ticketNumber
        : null;
    const ticketNumber =
      typeof rawTicketNumber === "number"
        ? rawTicketNumber
        : typeof rawTicketNumber === "string" && Number.isFinite(Number(rawTicketNumber))
          ? Number(rawTicketNumber)
          : null;

    if (!ticketId) {
      return { ticketId: null, ticketNumber: null, error: "Support ticket intake did not return a ticket ID." };
    }

    return { ticketId, ticketNumber, error: null };
  } catch (error) {
    return {
      ticketId: null,
      ticketNumber: null,
      error:
        error instanceof DOMException && error.name === "AbortError"
          ? "Support ticket intake timed out."
          : "Support ticket intake is unavailable.",
    };
  }
};
