import { type FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, ClipboardList, LifeBuoy, Mail, Send, X } from "lucide-react";
import { createSupportTicket } from "../lib/supportTickets";

const FEEDBACK_SUPPORT_EMAIL = "Support@RogueHoops.com";

type FeedbackCategoryId =
  | "bug"
  | "account-save"
  | "purchase-token"
  | "progress-reward"
  | "balance-content"
  | "feature-feedback"
  | "other";

const feedbackCategories: Array<{
  id: FeedbackCategoryId;
  label: string;
  description: string;
}> = [
  {
    id: "bug",
    label: "Bug or crash",
    description: "Something broke, froze, clipped, or behaved incorrectly.",
  },
  {
    id: "account-save",
    label: "Account or cloud save",
    description: "Login, guest mode, account progress, or save sync help.",
  },
  {
    id: "purchase-token",
    label: "Purchase or tokens",
    description: "Token balance, checkout, store purchase, or pack issue.",
  },
  {
    id: "progress-reward",
    label: "Progress or rewards",
    description: "Challenge clears, unlocks, collections, or Rogue payouts.",
  },
  {
    id: "balance-content",
    label: "Balance or player data",
    description: "Player ratings, badges, teams, or gameplay balance feedback.",
  },
  {
    id: "feature-feedback",
    label: "Feature feedback",
    description: "Ideas, improvements, quality of life, or general feedback.",
  },
  {
    id: "other",
    label: "Other support",
    description: "Anything that does not fit another route.",
  },
];

const impactOptions = [
  {
    id: "blocked",
    label: "Blocked",
    description: "I cannot keep playing or access something important.",
  },
  {
    id: "high",
    label: "High",
    description: "Major issue, but I can still use parts of the game.",
  },
  {
    id: "medium",
    label: "Medium",
    description: "Noticeable issue or feedback that should be reviewed.",
  },
  {
    id: "low",
    label: "Low / idea",
    description: "Polish note, suggestion, or non-urgent request.",
  },
] as const;

export interface FeedbackSupportDiagnostics {
  accountLabel: string;
  currentArea: string;
  currentScreen: string;
  isGuest: boolean;
  isLoggedIn: boolean;
  lifetimeTokensEarned: number;
  tokenBalance: number;
}

interface FeedbackSupportModalProps {
  accountEmail: string | null | undefined;
  diagnostics: FeedbackSupportDiagnostics;
  onClose: () => void;
}

const getCurrentPage = () => {
  if (typeof window === "undefined") return "Unavailable";
  return window.location.href;
};

const getBrowserDetails = () => {
  if (typeof window === "undefined") return "Unavailable";
  return window.navigator.userAgent;
};

export const FeedbackSupportModal = ({
  accountEmail,
  diagnostics,
  onClose,
}: FeedbackSupportModalProps) => {
  const [categoryId, setCategoryId] = useState<FeedbackCategoryId>("bug");
  const [impactId, setImpactId] = useState<(typeof impactOptions)[number]["id"]>("medium");
  const [replyEmail, setReplyEmail] = useState(accountEmail ?? "");
  const [gameArea, setGameArea] = useState(diagnostics.currentArea);
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicketReference, setSubmittedTicketReference] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => feedbackCategories.find((category) => category.id === categoryId) ?? feedbackCategories[0],
    [categoryId],
  );
  const selectedImpact = useMemo(
    () => impactOptions.find((impact) => impact.id === impactId) ?? impactOptions[2],
    [impactId],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const buildTicketBody = () => {
    const lines = [
      "NBA Ultimate Draft support ticket",
      "",
      `Ticket type: ${selectedCategory.label}`,
      `Impact: ${selectedImpact.label}`,
      `Reply email: ${replyEmail.trim()}`,
      `Game area: ${gameArea.trim()}`,
      "",
      "Summary:",
      summary.trim(),
      "",
      "Details / steps to reproduce:",
      details.trim(),
    ];

    if (includeDiagnostics) {
      lines.push(
        "",
        "Diagnostics:",
        `Account: ${diagnostics.accountLabel}`,
        `Auth state: ${diagnostics.isGuest ? "Guest Mode" : diagnostics.isLoggedIn ? "Signed in" : "Unknown"}`,
        `Current area: ${diagnostics.currentArea}`,
        `Current screen: ${diagnostics.currentScreen}`,
        `Token balance: ${diagnostics.tokenBalance}`,
        `Lifetime tokens earned: ${diagnostics.lifetimeTokensEarned}`,
        `Page: ${getCurrentPage()}`,
        `Browser: ${getBrowserDetails()}`,
      );
    }

    return lines.join("\n");
  };

  const openSupportEmail = () => {
    const subject = encodeURIComponent(
      `NBA Ultimate Draft ${selectedCategory.label}: ${summary.trim() || "Support request"}`,
    );
    const body = encodeURIComponent(buildTicketBody());

    window.location.href = `mailto:${FEEDBACK_SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    const result = await createSupportTicket({
      categoryId,
      categoryLabel: selectedCategory.label,
      impactId,
      impactLabel: selectedImpact.label,
      replyEmail: replyEmail.trim(),
      gameArea: gameArea.trim(),
      summary: summary.trim(),
      details: details.trim(),
      includeDiagnostics,
      diagnostics: {
        ...diagnostics,
        page: getCurrentPage(),
        browser: getBrowserDetails(),
      },
    }).catch(() => ({
      ticketId: null,
      ticketNumber: null,
      error: "Support ticket intake is unavailable.",
    }));
    setSubmitting(false);

    if (!result.error) {
      setSubmittedTicketReference(result.ticketNumber ? `#${result.ticketNumber}` : "created");
      return;
    }

    onClose();
    openSupportEmail();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden bg-slate-950/78 px-3 py-3 text-white backdrop-blur-sm sm:px-5"
      style={{ zIndex: 2147483647 }}
      role="presentation"
      onMouseDown={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onMouseDown={(event) => event.stopPropagation()}
        className="relative max-h-[calc(100vh-24px)] w-full max-w-3xl overflow-hidden rounded-[24px] border border-amber-200/18 bg-[#080b12] p-4 shadow-[0_30px_100px_rgba(0,0,0,0.72),0_0_42px_rgba(245,184,46,0.16)] sm:p-5"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/6 p-1.5 text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          aria-label="Close feedback support form"
        >
          <X size={14} />
        </button>

        {submittedTicketReference !== null ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center px-4 py-8 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-100/35 bg-emerald-300/14 text-emerald-100 shadow-[0_0_28px_rgba(52,211,153,0.24)]">
              <CheckCircle2 size={26} />
            </div>
            <div className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-100/76">
              Ticket Submitted
            </div>
            <h2 className="mt-2 font-display text-[clamp(1.8rem,3.6vw,2.6rem)] leading-none text-white">
              We got it.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
              Your support ticket has been created{` `}
              <span className="font-semibold text-emerald-100">{submittedTicketReference}</span>.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex items-center justify-center rounded-full border border-emerald-100/30 bg-emerald-300/14 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-50 transition hover:bg-emerald-300/20"
            >
              Done
            </button>
          </div>
        ) : (
        <>
        <div className="flex items-start gap-2.5 pr-9">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-amber-100/35 bg-amber-300/14 text-amber-100 shadow-[0_0_28px_rgba(245,184,46,0.24)]">
            <LifeBuoy size={19} />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-100/76">
              Feedback / Support
            </div>
            <h2 className="mt-0.5 font-display text-[clamp(1.45rem,3.4vw,2.25rem)] leading-none text-white">
              Tell us what needs attention
            </h2>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-slate-300">
              These fields route the ticket, capture impact, and include the details needed to reproduce or resolve the issue faster.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <label className="block">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
              <ClipboardList size={13} className="text-amber-100" />
              Ticket Type
            </span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value as FeedbackCategoryId)}
              className="login-auth-input mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/72 px-3 py-2.5 text-[13px] font-semibold text-white outline-none transition !appearance-auto focus:border-amber-100/55 focus:ring-2 focus:ring-amber-300/18"
            >
              {feedbackCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            <span className="mt-1.5 block text-[11px] leading-4 text-slate-400">{selectedCategory.description}</span>
          </label>

          <label className="block">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
              <AlertTriangle size={13} className="text-rose-100" />
              Impact
            </span>
            <select
              value={impactId}
              onChange={(event) => setImpactId(event.target.value as (typeof impactOptions)[number]["id"])}
              className="login-auth-input mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/72 px-3 py-2.5 text-[13px] font-semibold text-white outline-none transition !appearance-auto focus:border-amber-100/55 focus:ring-2 focus:ring-amber-300/18"
            >
              {impactOptions.map((impact) => (
                <option key={impact.id} value={impact.id}>
                  {impact.label}
                </option>
              ))}
            </select>
            <span className="mt-1.5 block text-[11px] leading-4 text-slate-400">{selectedImpact.description}</span>
          </label>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
              <Mail size={13} className="text-cyan-100" />
              Reply Email
            </span>
            <input
              type="text"
              inputMode="email"
              pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
              required
              value={replyEmail}
              onChange={(event) => setReplyEmail(event.target.value)}
              placeholder="you@example.com"
              className="login-auth-input mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/72 px-3 py-2.5 text-[13px] font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-amber-100/55 focus:ring-2 focus:ring-amber-300/18"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
              Game Area
            </span>
            <input
              type="text"
              required
              value={gameArea}
              onChange={(event) => setGameArea(event.target.value)}
              placeholder="Rogue Mode, Token Store, Draft, Results..."
              className="login-auth-input mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/72 px-3 py-2.5 text-[13px] font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-amber-100/55 focus:ring-2 focus:ring-amber-300/18"
            />
          </label>
        </div>

        <label className="mt-3 block">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
            Short Summary
          </span>
          <input
            type="text"
            required
            maxLength={120}
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Example: Token pack purchase did not add cards"
            className="login-auth-input mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/72 px-3 py-2.5 text-[13px] font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-amber-100/55 focus:ring-2 focus:ring-amber-300/18"
          />
        </label>

        <label className="mt-3 block">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
            Details
          </span>
          <textarea
            required
            rows={4}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="What happened, what you expected, and the steps that led there."
            className="login-auth-input mt-1.5 w-full resize-none rounded-2xl border border-white/10 bg-slate-950/72 px-3 py-2.5 text-[13px] font-medium leading-5 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-100/55 focus:ring-2 focus:ring-amber-300/18"
          />
        </label>

        <label className="mt-3 flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
          <input
            type="checkbox"
            checked={includeDiagnostics}
            onChange={(event) => setIncludeDiagnostics(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-slate-950 text-amber-300 accent-amber-300 focus:ring-amber-300/30"
          />
          <span className="text-[12px] leading-5 text-slate-300">
            Include diagnostics: account mode, current screen, token totals, page URL, and browser details.
          </span>
        </label>

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-100/45 bg-[linear-gradient(135deg,rgba(251,191,36,0.98),rgba(250,204,21,0.9),rgba(16,185,129,0.78))] px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-950 shadow-[0_16px_34px_rgba(251,191,36,0.26),0_0_24px_rgba(52,211,153,0.12)] transition hover:scale-[1.01]"
          >
            <Send size={14} />
            {submitting ? "Submitting..." : "Submit Ticket"}
          </button>
        </div>
        </>
        )}
      </form>
    </div>,
    document.body,
  );
};
