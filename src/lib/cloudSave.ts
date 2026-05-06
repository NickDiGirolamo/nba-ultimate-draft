import { publicSupabaseAnonKey, publicSupabaseUrl, supabase } from "./supabase";
import { defaultTokenPackProducts, type TokenPackProduct } from "./tokenPacks";

export const ensureUserProfile = async (userId: string, email?: string | null) => {
  if (!supabase) return;

  const username = email?.split("@")[0] ?? null;
  const { error } = await supabase.from("user_profiles").upsert({
    id: userId,
    username,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.warn("Unable to save Supabase user profile", error);
  }
};

interface SyncTokenBalanceOptions {
  source?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export const syncTokenBalance = async (
  userId: string,
  tokenBalance: number,
  options: SyncTokenBalanceOptions = {},
) => {
  if (!supabase) return;

  const normalizedBalance = Math.max(0, Math.floor(tokenBalance));
  const { error: rpcError } = await supabase.rpc("sync_user_token_balance", {
    next_token_balance: normalizedBalance,
    transaction_source: options.source ?? "local_balance_sync",
    transaction_description: options.description ?? "Synced token balance from game progress.",
    transaction_metadata: options.metadata ?? {},
  });

  if (!rpcError) return;

  console.warn("Unable to save Supabase token balance with RPC", rpcError);

  const { error } = await supabase.from("user_token_balances").upsert(
    {
      user_id: userId,
      token_balance: normalizedBalance,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.warn("Unable to save Supabase token balance with fallback", error);
  }
};

export const fetchTokenBalance = async (userId: string) => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_token_balances")
    .select("token_balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Unable to load Supabase token balance", error);
    return null;
  }

  return typeof data?.token_balance === "number" ? data.token_balance : null;
};

export const fetchActiveRogueRun = async (userId: string) => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("saved_rogue_runs")
    .select("run_data")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.warn("Unable to load Supabase Rogue run", error);
    return null;
  }

  return data?.run_data ?? null;
};

export const upsertActiveRogueRun = async (userId: string, runData: unknown) => {
  if (!supabase) return;

  const { error: rpcError } = await supabase.rpc("sync_active_rogue_run", {
    next_run_data: runData,
  });

  if (!rpcError) return;

  console.warn("Unable to save Supabase Rogue run with RPC", rpcError);

  const now = new Date().toISOString();
  const { error } = await supabase.from("saved_rogue_runs").upsert(
    {
      user_id: userId,
      run_data: runData,
      status: "active",
      updated_at: now,
    },
    { onConflict: "user_id,status" },
  );

  if (error) {
    console.warn("Unable to save Supabase Rogue run with fallback", error);
  }
};

export const deleteActiveRogueRun = async (userId: string) => {
  if (!supabase) return;

  const { error } = await supabase
    .from("saved_rogue_runs")
    .delete()
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    console.warn("Unable to delete Supabase Rogue run", error);
  }
};

export const fetchActiveTokenPacks = async (): Promise<TokenPackProduct[]> => {
  if (!supabase) return defaultTokenPackProducts;

  const { data, error } = await supabase
    .from("token_pack_products")
    .select("id, slug, name, description, token_amount, usd_cents, currency, stripe_price_id, active, sort_order, metadata")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.warn("Unable to load Supabase token packs", error);
    return defaultTokenPackProducts;
  }

  if (!data || data.length === 0) return defaultTokenPackProducts;

  return data.map((pack) => ({
    id: String(pack.id),
    slug: String(pack.slug),
    name: String(pack.name),
    description: typeof pack.description === "string" ? pack.description : null,
    tokenAmount: Number(pack.token_amount),
    usdCents: Number(pack.usd_cents),
    currency: typeof pack.currency === "string" ? pack.currency : "usd",
    stripePriceId: typeof pack.stripe_price_id === "string" ? pack.stripe_price_id : null,
    active: Boolean(pack.active),
    sortOrder: Number(pack.sort_order),
    metadata:
      pack.metadata && typeof pack.metadata === "object" && !Array.isArray(pack.metadata)
        ? (pack.metadata as Record<string, unknown>)
        : {},
  }));
};

export const createTokenPackCheckoutSession = async (packSlug: string) => {
  if (!supabase || !publicSupabaseUrl || !publicSupabaseAnonKey) {
    return { checkoutUrl: null, error: "Supabase is not configured." };
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    return { checkoutUrl: null, error: "You must be signed in to buy tokens." };
  }

  const response = await fetch(`${publicSupabaseUrl}/functions/v1/create-checkout-session`, {
    method: "POST",
    headers: {
      apikey: publicSupabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      packSlug,
      successUrl: origin ? `${origin}/?checkout=success` : undefined,
      cancelUrl: origin ? `${origin}/?checkout=cancelled` : undefined,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
      return { checkoutUrl: null, error: data.error };
    }

    return { checkoutUrl: null, error: `Checkout request failed with status ${response.status}.` };
  }

  const checkoutUrl =
    data && typeof data === "object" && "checkoutUrl" in data && typeof data.checkoutUrl === "string"
      ? data.checkoutUrl
      : null;

  if (!checkoutUrl) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : "Stripe checkout did not return a URL.";
    return { checkoutUrl: null, error: message };
  }

  return { checkoutUrl, error: null };
};
