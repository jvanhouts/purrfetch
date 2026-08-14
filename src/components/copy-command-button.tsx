import { useEffect, useRef, useState } from "react";
import { COMMAND } from "@/command";

/** Lucide `copy`, inlined so the CLI-first package stays dependency-free. */
function CopyIcon() {
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
      <rect height="14" rx="2" ry="2" width="14" x="8" y="8" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

/** Lucide `check`. */
function CheckIcon() {
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
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function CopyCommandButton() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(COMMAND);
    } catch {
      return; // Clipboard blocked (insecure context, denied permission) — say nothing.
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      aria-label={copied ? "command copied" : "copy stats command"}
      className="group rounded-lg border border-white/10 bg-ink-900/70 px-3 py-2 text-xs backdrop-blur-md transition-colors hover:border-white/20 hover:bg-ink-800/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mint/50"
      onClick={copy}
      type="button"
    >
      {/* Both states share one grid cell, so the button keeps the width of the
          wider label and the two can cross-fade in place. */}
      <span className="grid items-center">
        <span
          aria-hidden
          className={`col-start-1 row-start-1 flex items-center gap-2 text-mist-300 transition-all duration-200 group-hover:text-mist-100 ${
            copied ? "-translate-y-1 opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          copy stats command
          <CopyIcon />
        </span>
        <span
          aria-hidden
          className={`col-start-1 row-start-1 flex items-center gap-2 text-mint transition-all duration-200 ${
            copied ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          }`}
        >
          command copied
          <CheckIcon />
        </span>
      </span>
    </button>
  );
}
