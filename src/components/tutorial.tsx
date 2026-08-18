import { type RefObject, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Lucide `chevron-left` / `chevron-right`, mirrored from one path. */
function Chevron({ back }: { back?: boolean }) {
  return (
    <svg
      aria-hidden
      className={`size-3.5 ${back ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/** Lucide `x`. */
function CloseIcon() {
  return (
    <svg
      aria-hidden
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

const STEPS = [
  {
    /** Step two is about the terminal, so the arrow would be pointing at the
     *  wrong screen — the ring stays, the arrow doesn't. */
    arrow: true,
    emphasis: false,
    text: "This copies a one-liner that reads your machine's stats. Hit it.",
  },
  {
    arrow: false,
    emphasis: true,
    text: "Go to your terminal and paste the command!",
  },
] as const;

/** Breathing room between a target and the ring drawn around it. */
const PAD = 8;
/** How far under the toolbar the bubble sits — the gap the arrow lives in. */
const GAP = 76;
const BUBBLE_WIDTH = 320;

type Props = {
  copyRef: RefObject<HTMLElement | null>;
  onClose: () => void;
};

/**
 * A two-step walkthrough of the copy button: a ring around it, and a bubble
 * underneath saying what to do with it.
 */
export function Tutorial({ copyRef, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [box, setBox] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const copy = copyRef.current?.getBoundingClientRect();
      if (copy) setBox(copy);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [copyRef]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setStep((s) => Math.min(s + 1, STEPS.length - 1));
      if (event.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!box) return null;

  const current = STEPS[step] ?? STEPS[0];
  const ring = {
    left: box.left - PAD,
    top: box.top - PAD,
    width: box.width + PAD * 2,
    height: box.height + PAD * 2,
  };

  const bubbleLeft = box.left;
  const bubbleTop = box.bottom + PAD + GAP;

  // The arrow runs from the bubble's top edge up to the underside of the ring,
  // bowing away from the straight line so it reads as drawn, not routed.
  const start = { x: bubbleLeft + 30, y: bubbleTop - 8 };
  const end = { x: ring.left + ring.width / 2, y: ring.top + ring.height + 8 };
  const bow = end.x >= start.x ? 30 : -30;
  const control = { x: (start.x + end.x) / 2 - bow, y: start.y - (start.y - end.y) * 0.55 };

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-40" data-screenshot-hide>
      {/* Same trick as the first-visit spotlight: the page dims as this ring's
          shadow, and pointer events fall through so the button still works. */}
      <div
        className="pointer-events-none absolute animate-tutorial-ring rounded-xl border border-azure/60"
        style={{
          left: ring.left,
          top: ring.top,
          width: ring.width,
          height: ring.height,
          boxShadow: "0 0 0 100vmax var(--tone-spotlight)",
          transition: "left 260ms ease, top 260ms ease, width 260ms ease, height 260ms ease",
        }}
      />

      {current.arrow && (
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full">
          <defs>
            <marker
              id="tutorial-arrowhead"
              markerHeight="6"
              markerWidth="6"
              orient="auto"
              refX="5"
              refY="3"
            >
              <path d="M0 0 6 3 0 6z" fill="var(--color-azure)" />
            </marker>
          </defs>
          <path
            d={`M${start.x} ${start.y} Q${control.x} ${control.y} ${end.x} ${end.y}`}
            fill="none"
            markerEnd="url(#tutorial-arrowhead)"
            stroke="var(--color-azure)"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </svg>
      )}

      <div
        className="pointer-events-auto absolute rounded-xl border border-veil/10 bg-ink-900/95 p-5 shadow-[0_30px_80px_-30px_var(--tone-shadow)] backdrop-blur-xl"
        style={{
          left: bubbleLeft,
          top: bubbleTop,
          width: BUBBLE_WIDTH,
          maxWidth: "calc(100vw - 3rem)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-medium text-azure-100 text-xs">purrfetch</h2>
          <button
            aria-label="close"
            className="-mt-1 -mr-1 rounded p-1 text-mist-600 transition-colors hover:text-mist-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-azure/50"
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <p
          className={`mt-3 text-sm leading-[1.65] ${
            current.emphasis
              ? "animate-step-nudge font-semibold text-mist-100"
              : "text-mist-300"
          }`}
        >
          {current.text}
        </p>

        <div className="mt-5 flex items-center justify-end gap-3 text-mist-500 text-[11px]">
          <button
            aria-label="previous step"
            className="rounded p-1 transition-colors hover:text-mist-100 disabled:opacity-30 disabled:hover:text-mist-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-azure/50"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
            type="button"
          >
            <Chevron back />
          </button>
          <span className="tabular-nums">
            {step + 1}/{STEPS.length}
          </span>
          <button
            aria-label={step === STEPS.length - 1 ? "finish" : "next step"}
            className="rounded p-1 transition-colors hover:text-mist-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-azure/50"
            onClick={() => (step === STEPS.length - 1 ? onClose() : setStep((s) => s + 1))}
            type="button"
          >
            <Chevron />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
