import { supabase } from "./supabase";

export type AnalyticsEventName =
  | "home_viewed"
  | "rogue_start_clicked"
  | "rogue_run_started"
  | "starter_pack_selected"
  | "coach_selected"
  | "boss_reached"
  | "boss_won"
  | "boss_lost"
  | "run_completed"
  | "run_failed"
  | "token_store_opened"
  | "token_pack_clicked"
  | "checkout_started"
  | "purchase_returned"
  | "token_balance_synced"
  | "store_item_purchased"
  | "store_reward_claimed"
  | "exchange_challenge_started"
  | "exchange_challenge_completed";

type AnalyticsPayload = Record<string, unknown>;

interface TrackAnalyticsEventOptions {
  runId?: string | number | null;
  payload?: AnalyticsPayload;
}

const ANALYTICS_ANONYMOUS_ID_STORAGE_KEY = "nba-ultimate-draft-anonymous-id-v1";

const createAnonymousId = () => {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getAnonymousId = () => {
  if (typeof window === "undefined") return null;

  try {
    const existingId = window.localStorage.getItem(ANALYTICS_ANONYMOUS_ID_STORAGE_KEY);
    if (existingId) return existingId;

    const nextId = createAnonymousId();
    window.localStorage.setItem(ANALYTICS_ANONYMOUS_ID_STORAGE_KEY, nextId);
    return nextId;
  } catch {
    return null;
  }
};

export const trackAnalyticsEvent = async (
  eventName: AnalyticsEventName,
  options: TrackAnalyticsEventOptions = {},
) => {
  if (!supabase || typeof window === "undefined") return;

  const anonymousId = getAnonymousId();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { error } = await supabase.from("analytics_events").insert({
    user_id: session?.user?.id ?? null,
    anonymous_id: anonymousId,
    event_name: eventName,
    route: `${window.location.pathname}${window.location.search}`,
    run_id: options.runId == null ? null : String(options.runId),
    payload: options.payload ?? {},
  });

  if (error) {
    console.warn("Unable to track analytics event", eventName, error);
  }
};

export const trackAnalyticsEventSoon = (
  eventName: AnalyticsEventName,
  options: TrackAnalyticsEventOptions = {},
) => {
  void trackAnalyticsEvent(eventName, options);
};
