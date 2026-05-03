import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, CheckCircle2, X } from "lucide-react";

export interface GuidedTutorialStep {
  id: string;
  targetId: string;
  spotlightTargetId?: string;
  title: string;
  body: string;
  placement?: "top" | "bottom" | "right";
  advanceOnTargetClick?: boolean;
  waitingTitle?: string;
  waitingBody?: string;
}

interface GuidedTutorialOverlayProps {
  steps: GuidedTutorialStep[];
  activeStepIndex: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onFinish: () => void;
}

const HIGHLIGHT_PADDING = 10;
const TOOLTIP_WIDTH = 360;
const TOOLTIP_GAP = 18;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const GuidedTutorialOverlay = ({
  steps,
  activeStepIndex,
  onNext,
  onBack,
  onSkip,
  onFinish,
}: GuidedTutorialOverlayProps) => {
  const step = steps[activeStepIndex] ?? null;
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const isLastStep = activeStepIndex >= steps.length - 1;
  const requiresTargetClick = Boolean(step?.advanceOnTargetClick);

  useEffect(() => {
    if (!step || typeof document === "undefined") return;

    let frameId = 0;
    let observer: ResizeObserver | null = null;
    const spotlightId = step.spotlightTargetId ?? step.targetId;

    const syncTarget = () => {
      const clickElement = document.querySelector<HTMLElement>(`[data-tutorial-id="${step.targetId}"]`);
      const spotlightElement = document.querySelector<HTMLElement>(`[data-tutorial-id="${spotlightId}"]`);
      setTargetElement(clickElement);
      setTargetRect(spotlightElement?.getBoundingClientRect() ?? null);
    };

    const scrollToTarget = () => {
      const element = document.querySelector<HTMLElement>(`[data-tutorial-id="${spotlightId}"]`);
      if (!element) {
        syncTarget();
        return;
      }

      element.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
      window.setTimeout(syncTarget, 260);
    };

    scrollToTarget();
    frameId = window.requestAnimationFrame(syncTarget);

    const handleViewportChange = () => syncTarget();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    const element = document.querySelector<HTMLElement>(`[data-tutorial-id="${spotlightId}"]`);
    if (element && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(syncTarget);
      observer.observe(element);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
      observer?.disconnect();
    };
  }, [step]);

  useEffect(() => {
    if (!targetElement || !step?.advanceOnTargetClick) return;

    const handleTargetClick = () => {
      window.setTimeout(() => {
        if (isLastStep) {
          onFinish();
          return;
        }

        onNext();
      }, 240);
    };

    targetElement.addEventListener("click", handleTargetClick);
    return () => targetElement.removeEventListener("click", handleTargetClick);
  }, [isLastStep, onFinish, onNext, step?.advanceOnTargetClick, targetElement]);

  const highlight = useMemo(() => {
    if (!targetRect) return null;

    const top = Math.max(0, targetRect.top - HIGHLIGHT_PADDING);
    const left = Math.max(0, targetRect.left - HIGHLIGHT_PADDING);
    const width = Math.min(window.innerWidth - left, targetRect.width + HIGHLIGHT_PADDING * 2);
    const height = Math.min(window.innerHeight - top, targetRect.height + HIGHLIGHT_PADDING * 2);

    return {
      top,
      left,
      width,
      height,
      right: Math.min(window.innerWidth, left + width),
      bottom: Math.min(window.innerHeight, top + height),
    };
  }, [targetRect]);

  if (!step || typeof document === "undefined") return null;

  const preferredPlacement = step.placement ?? "bottom";
  const tooltipLeft = highlight
    ? preferredPlacement === "right"
      ? clamp(
          highlight.right + TOOLTIP_GAP,
          14,
          Math.max(14, window.innerWidth - TOOLTIP_WIDTH - 14),
        )
      : clamp(
          highlight.left + highlight.width / 2 - TOOLTIP_WIDTH / 2,
          14,
          Math.max(14, window.innerWidth - TOOLTIP_WIDTH - 14),
        )
    : clamp(window.innerWidth / 2 - TOOLTIP_WIDTH / 2, 14, Math.max(14, window.innerWidth - TOOLTIP_WIDTH - 14));
  const tooltipTop = highlight
    ? preferredPlacement === "right"
      ? clamp(highlight.top + highlight.height / 2 - 130, 16, window.innerHeight - 260)
      : preferredPlacement === "top"
        ? clamp(highlight.top - TOOLTIP_GAP - 220, 16, window.innerHeight - 260)
        : clamp(highlight.bottom + TOOLTIP_GAP, 16, window.innerHeight - 260)
    : clamp(window.innerHeight / 2 - 130, 16, window.innerHeight - 260);
  const targetReady = Boolean(targetElement);
  const displayTitle = targetReady ? step.title : step.waitingTitle ?? "Keep going";
  const displayBody = targetReady
    ? step.body
    : step.waitingBody ?? "Finish the current action and the guide will pick back up when the next highlighted control appears.";

  const overlay = (
    <div className="pointer-events-none fixed inset-0 z-[180]">
      {highlight ? (
        <>
          <div className="fixed left-0 top-0 bg-slate-950/78 backdrop-blur-[2px]" style={{ right: 0, height: highlight.top }} />
          <div className="fixed left-0 bg-slate-950/78 backdrop-blur-[2px]" style={{ top: highlight.bottom, right: 0, bottom: 0 }} />
          <div className="fixed left-0 bg-slate-950/78 backdrop-blur-[2px]" style={{ top: highlight.top, width: highlight.left, height: highlight.height }} />
          <div className="fixed bg-slate-950/78 backdrop-blur-[2px]" style={{ top: highlight.top, left: highlight.right, right: 0, height: highlight.height }} />
          <div
            className="pointer-events-none fixed rounded-[24px] border-2 border-amber-100/90 shadow-[0_0_0_1px_rgba(251,191,36,0.34),0_0_42px_rgba(251,191,36,0.46),inset_0_0_30px_rgba(251,191,36,0.08)]"
            style={{
              left: highlight.left,
              top: highlight.top,
              width: highlight.width,
              height: highlight.height,
            }}
          />
        </>
      ) : (
        <div className="pointer-events-none fixed inset-0 bg-slate-950/52 backdrop-blur-[1px]" />
      )}

      <div
        className="pointer-events-auto fixed w-[min(360px,calc(100vw-28px))] rounded-[26px] border border-amber-100/26 bg-[linear-gradient(145deg,rgba(13,17,28,0.98),rgba(28,22,11,0.98))] p-5 text-white shadow-[0_26px_80px_rgba(0,0,0,0.55),0_0_46px_rgba(245,158,11,0.16)]"
        style={{ left: tooltipLeft, top: tooltipTop }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-amber-100/72">
              Step {activeStepIndex + 1} of {steps.length}
            </div>
            <h2 className="mt-2 font-display text-2xl leading-tight text-white">{displayTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-full border border-white/10 bg-white/6 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Skip tutorial"
          >
            <X size={15} />
          </button>
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-200/88">{displayBody}</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-100 to-emerald-200"
            style={{ width: `${Math.round(((activeStepIndex + 1) / steps.length) * 100)}%` }}
          />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onBack}
              disabled={activeStepIndex === 0}
              className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="rounded-full border border-white/12 bg-black/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:bg-white/8"
            >
              Skip
            </button>
          </div>
          {requiresTargetClick ? null : (
            <button
              type="button"
              onClick={isLastStep ? onFinish : onNext}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-950 transition hover:scale-[1.02]"
            >
              {isLastStep ? (
                <>
                  Finish
                  <CheckCircle2 size={14} />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
};
