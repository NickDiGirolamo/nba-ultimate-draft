import { supabase } from "./supabase";

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

export const syncTokenBalance = async (userId: string, tokenBalance: number) => {
  if (!supabase) return;

  const normalizedBalance = Math.max(0, Math.floor(tokenBalance));
  const { error: rpcError } = await supabase.rpc("sync_user_token_balance", {
    next_token_balance: normalizedBalance,
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
