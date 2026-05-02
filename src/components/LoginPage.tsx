import { useState } from "react";
import { LockKeyhole, LogIn, Trophy, UserPlus } from "lucide-react";

interface LoginPageProps {
  configured: boolean;
  loading: boolean;
  authError: string | null;
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onSignUp: (email: string, password: string) => Promise<boolean>;
}

export const LoginPage = ({
  configured,
  loading,
  authError,
  onSignIn,
  onSignUp,
}: LoginPageProps) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setNotice("Enter your email and password to continue.");
      return;
    }

    setNotice(null);
    setSubmitting(true);

    const ok = mode === "login"
      ? await onSignIn(email.trim(), password)
      : await onSignUp(email.trim(), password);

    if (ok && mode === "signup") {
      setNotice("Account created. Check your email if confirmation is enabled, then sign in.");
    }

    setSubmitting(false);
  };

  return (
    <main className="arena-shell min-h-screen text-white">
      <div className="mx-auto flex min-h-screen max-w-[1180px] items-center px-5 py-8">
        <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <section className="rounded-[28px] border border-white/12 bg-black/36 p-7 shadow-[0_24px_70px_rgba(0,0,0,0.42)] backdrop-blur md:p-9">
            <div className="inline-flex items-center gap-3 rounded-full border border-amber-200/18 bg-amber-300/10 px-4 py-2 text-amber-100">
              <Trophy size={18} />
              <span className="text-xs font-semibold uppercase tracking-[0.22em]">NBA Ultimate Draft</span>
            </div>
            <h1 className="mt-7 font-display text-[clamp(2.6rem,6vw,5.25rem)] leading-none text-white">
              Build your Rogue dynasty.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Sign in to access your token bank, saved Rogue runs, unlocks, and account progress.
            </p>
          </section>

          <section className="rounded-[28px] border border-white/14 bg-[linear-gradient(145deg,rgba(5,10,20,0.94),rgba(12,24,42,0.9))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] md:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-200/18 bg-cyan-300/12 p-3 text-cyan-100">
                <LockKeyhole size={20} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Account Required</div>
                <h2 className="mt-1 font-display text-3xl text-white">
                  {mode === "login" ? "Sign in" : "Create account"}
                </h2>
              </div>
            </div>

            {!configured ? (
              <div className="mt-6 rounded-2xl border border-amber-200/18 bg-amber-300/10 px-4 py-4 text-sm leading-6 text-amber-50/88">
                Supabase is not configured yet. Add your project URL and anon key to continue.
              </div>
            ) : (
              <div className="mt-7 space-y-4">
                <label className="block text-sm font-semibold text-slate-200">
                  Email
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/12 bg-black/36 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/45 focus:bg-black/48"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-200">
                  Password
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/12 bg-black/36 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/45 focus:bg-black/48"
                    type="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder="Password"
                  />
                </label>

                {authError || notice ? (
                  <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm leading-6 text-slate-200">
                    {authError ?? notice}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={submit}
                    disabled={loading || submitting}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-950 transition hover:scale-[1.015] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {mode === "login" ? <LogIn size={15} /> : <UserPlus size={15} />}
                    {submitting ? "Working..." : mode === "login" ? "Sign In" : "Sign Up"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === "login" ? "signup" : "login");
                      setNotice(null);
                    }}
                    className="rounded-full border border-white/14 bg-white/6 px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
                  >
                    {mode === "login" ? "Create Account" : "Use Login"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};
