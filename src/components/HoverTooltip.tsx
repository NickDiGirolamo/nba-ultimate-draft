import { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TooltipPosition {
  top: number;
  left: number;
}

interface HoverTooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
}

const TOOLTIP_WIDTH = 260;
const VIEWPORT_PADDING = 12;
const GAP = 10;

export const HoverTooltip = ({
  content,
  children,
  className,
}: HoverTooltipProps) => {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ top: 0, left: 0 });

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger || typeof window === "undefined") return;

    const rect = trigger.getBoundingClientRect();
    const minLeft = VIEWPORT_PADDING + TOOLTIP_WIDTH / 2;
    const maxLeft = window.innerWidth - VIEWPORT_PADDING - TOOLTIP_WIDTH / 2;
    const centeredLeft = rect.left + rect.width / 2;

    setPosition({
      top: rect.top - GAP,
      left: Math.min(Math.max(centeredLeft, minLeft), maxLeft),
    });
  };

  useEffect(() => {
    if (!open) return;

    updatePosition();

    const handleWindowChange = () => updatePosition();
    window.addEventListener("scroll", handleWindowChange, true);
    window.addEventListener("resize", handleWindowChange);

    return () => {
      window.removeEventListener("scroll", handleWindowChange, true);
      window.removeEventListener("resize", handleWindowChange);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (triggerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <>
      <div
        ref={triggerRef}
        className={className}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((current) => !current)}
      >
        {children}
      </div>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[200] w-[min(260px,calc(100vw-24px))] -translate-x-1/2 -translate-y-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-center text-[11px] font-medium leading-5 text-slate-100 shadow-[0_18px_40px_rgba(2,6,23,0.6)]"
              style={{ top: position.top, left: position.left }}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
};
