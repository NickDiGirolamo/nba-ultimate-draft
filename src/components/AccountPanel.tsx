import { useState } from "react";
import { LogIn, LogOut, UserRound } from "lucide-react";

interface AccountPanelProps {
  configured: boolean;
  loading: boolean;
  userEmail?: string | null;
  authError: string | null;
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onSignUp: (email: string, password: string) => Promise<boolean>;
  onSignOut: () => Promise<void>;
}

export const AccountPanel = ({
  configured,
  loading,
  userEmail,
  authError,
  onSignIn,
  onSignUp,
  onSignOut,
}: AccountPanelProps) => {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    setNotice(null);
    const ok = mode === "login"
      ? await onSignIn(email.trim(), password)
      : await onSignUp(email.trim(), password);

    if (ok && mode === "signup") {
      setNotice("Account created. Check your email if confirmation is enabled.");
    }

    if (ok && mode === "login") {
      setExpanded(false);
      setPassword("");
    }
  };

  if (!configured) {
    return (
      <div className="rounded-2xl border border-amber-200/14 bg-black/22 px-4 py-3 text-xs leading-5 text-amber-50/82">
        Supabase not configured. Local play and local saves are still active.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/24 px-4 py-3 shadow-[0_14px_34px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-cyan-200/18 bg-cyan-300/12 p-2 text-cyan-100">
            <UserRound size={14} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Account</div>
            <div className="mt-0.5 text-sm font-semibold text-white">
              {loading ? "Checking session..." : userEmail ?? "Local Player"}
            </div>
          </div>
        </div>

        {userEmail ? (
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
          >
            <LogOut size={13} />
            Logout
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-100/22 bg-cyan-100/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-50 transition hover:bg-cyan-100/18"
          >
            <LogIn size={13} />
            Login
          </button>
        )}
      </div>

      {!userEmail && expanded ? (
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
          <label className="block text-xs text-slate-300">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-200/34"
              type="email"
              autoComplete="email"
            />
          </label>
          <label className="block text-xs text-slate-300">
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-200/34"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>
          <button
            type="button"
            onClick={submit}
            className="rounded-full bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-950 transition hover:scale-[1.02]"
          >
            {mode === "login" ? "Sign In" : "Sign Up"}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="rounded-full border border-white/12 bg-white/6 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
          >
            {mode === "login" ? "Create" : "Login"}
          </button>
          {authError || notice ? (
            <div className="text-xs leading-5 text-slate-300 md:col-span-4">
              {authError ?? notice}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
