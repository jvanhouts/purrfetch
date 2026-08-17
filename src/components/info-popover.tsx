import { useEffect, useRef, useState } from "react";

/** Lucide `info`, inlined to match the copy button's icons. */
function InfoIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
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
  "Copy the stats command with the button on the left.",
  "Run it in your shell.",
  "Paste the output back here to fill in your own machine.",
];

export function InfoPopover() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Dismiss the way every other popover does: Escape, or a click outside it.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={root}>
      <button
        aria-expanded={open}
        aria-label="about purrfetch"
        className={`rounded-lg border bg-ink-900/70 px-2.5 py-2 backdrop-blur-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mint/50 ${
          open
            ? "border-white/20 bg-ink-800/80 text-mist-100"
            : "border-white/10 text-mist-300 hover:border-white/20 hover:bg-ink-800/80 hover:text-mist-100"
        }`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <InfoIcon />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-3 w-[26rem] max-w-[calc(100vw-3rem)] rounded-xl border border-white/10 bg-ink-900/95 p-6 text-xs leading-[1.7] shadow-[0_30px_80px_-30px_#000] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-medium text-mint tracking-[0.14em]">PURRFETCH</h2>
            <button
              aria-label="close"
              className="-mt-0.5 -mr-1 rounded p-1 text-mist-600 transition-colors hover:text-mist-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mint/50"
              onClick={() => setOpen(false)}
              type="button"
            >
              <CloseIcon />
            </button>
          </div>

          <p className="mt-4 text-mist-300">
            A neofetch-style system readout, rendered in React instead of the terminal. Same
            fields, nicer typography.
          </p>

          <div className="my-5 h-px w-full bg-white/10" />

          <ol className="space-y-3">
            {STEPS.map((step, index) => (
              <li className="flex gap-4" key={step}>
                <span className="text-mint">{index + 1}</span>
                <span className="flex-1 text-mist-300">{step}</span>
              </li>
            ))}
          </ol>

          <p className="mt-5 text-mist-600">
            Every label and value is editable — click any of them to type over it.
          </p>
        </div>
      )}
    </div>
  );
}
