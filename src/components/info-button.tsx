import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Lucide `info`, a size up from the toolbar's icons — this one has to be found. */
function InfoIcon() {
  return (
    <svg
      aria-hidden
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

const SEEN_KEY = "purrfetch:seen";

/** Private mode and locked-down storage both throw — a first visit every time
 *  is a nicer failure than a blank page. */
function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return false;
  }
}

function writeSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Nothing to do — the spotlight just shows again next time.
  }
}

type Props = {
  /** Opens the tutorial. */
  onStart: () => void;
  /** Suppresses the first-visit spotlight while the tutorial is running. */
  busy: boolean;
};

/**
 * The way in. It flashes on load so it's noticed at all, and on a first visit
 * it's the only lit thing on the page.
 */
export function InfoButton({ onStart, busy }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const [firstVisit, setFirstVisit] = useState(readSeen() === false);
  const [circle, setCircle] = useState<{ x: number; y: number } | null>(null);

  const dismiss = () => {
    setFirstVisit(false);
    writeSeen();
  };

  // The spotlight is a hole punched around the button, so it has to follow the
  // button rather than assume a corner.
  useLayoutEffect(() => {
    if (!firstVisit) return;
    const measure = () => {
      const box = ref.current?.getBoundingClientRect();
      if (box) setCircle({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [firstVisit]);

  // Any keypress means they've seen it.
  useEffect(() => {
    if (!firstVisit) return;
    const onKeyDown = () => {
      setFirstVisit(false);
      writeSeen();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [firstVisit]);

  const lit = firstVisit && !busy;

  return (
    <>
      <button
        aria-label="how this works"
        className={`fixed top-6 right-6 z-30 rounded-xl border border-veil/10 bg-ink-900/70 p-2.5 text-mist-300 backdrop-blur-md transition-colors hover:border-veil/20 hover:bg-ink-800/80 hover:text-mist-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-azure/50 ${
          lit ? "!border-azure/60 text-mist-100" : ""
        } animate-info-flash`}
        data-screenshot-hide
        onClick={() => {
          dismiss();
          onStart();
        }}
        ref={ref}
        type="button"
      >
        <InfoIcon />
      </button>

      {lit &&
        circle &&
        createPortal(
          <div
            className="fixed inset-0 z-20"
            onPointerDown={dismiss}
            style={{ cursor: "default" }}
          >
            {/* The dim is this circle's shadow, so the ring and the darkness can
                never drift apart. Clicks fall through to the button itself. */}
            <div
              className="pointer-events-none absolute animate-spot-breathe rounded-full border border-azure/50"
              style={{
                left: circle.x - 44,
                top: circle.y - 44,
                width: 88,
                height: 88,
                boxShadow: "0 0 0 100vmax var(--tone-spotlight)",
              }}
            />
            <p
              className="pointer-events-none absolute w-56 text-right text-mist-300 text-xs leading-[1.7]"
              style={{ right: `calc(100vw - ${circle.x + 44}px)`, top: circle.y + 60 }}
            >
              New here? Start with this.
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}
