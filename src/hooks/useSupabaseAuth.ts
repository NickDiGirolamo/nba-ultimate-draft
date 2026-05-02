import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { ensureUserProfile } from "../lib/cloudSave";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export const useSupabaseAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const user = session?.user;
    if (!user) return;
    void ensureUserProfile(user.id, user.email);
  }, [session?.user]);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      setAuthError("Supabase is not configured yet.");
      return false;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    setAuthError(error?.message ?? null);
    return !error;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      setAuthError("Supabase is not configured yet.");
      return false;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthError(error?.message ?? null);
    return !error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    setAuthError(error?.message ?? null);
  }, []);

  return {
    configured: isSupabaseConfigured,
    loading,
    session,
    user: (session?.user ?? null) as User | null,
    authError,
    signUp,
    signIn,
    signOut,
  };
};
