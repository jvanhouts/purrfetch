import { useEffect, useRef, useState } from "react";
import { COMMAND } from "@/command";
import { SCRIPT_BLOB_URL, SCRIPT_PATH, SCRIPT_RAW_URL } from "@/script-source";
import { useScriptSource } from "@/use-script-source";

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

/** Lucide `chevron-down`, rotated by the caller when the panel is open. */
function ChevronIcon() {
  return (
    <svg
      aria-hidden
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Lucide `copy`. */
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

/**
 * A copy button that reports back in place, the way the main one does.
 * `text` is read at click time so it can't copy a stale source.
 */
function CopyButton({ label, text }: { label: string; text: () => string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text());
    } catch {
      return; // Clipboard blocked — the text is selectable, so there's a way through.
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      className={`flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-azure/50 ${
        copied
          ? "border-azure/40 text-azure-100"
          : "border-veil/10 text-mist-500 hover:border-veil/20 hover:text-mist-100"
      }`}
      onClick={copy}
      type="button"
    >
      {copied ? "copied" : label}
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

/** Collapsed height of the source panel, in the `pre`'s own line-height units. */
const COLLAPSED = "18rem";

type Props = { onClose: () => void };

/**
 * The receipts: the literal command, and the script that command downloads —
 * pulled from GitHub at open time so it's the same bytes the shell will get.
 */
export function ParanoidModal({ onClose }: Props) {
  const [expanded, setExpanded] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const source = useScriptSource(true);

  // Escape closes; the backdrop swallows clicks outside the panel.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Focus the panel so Escape and scrolling land here, not on the page behind.
  useEffect(() => {
    panel.current?.focus();
  }, []);

  const lines = source ? source.text.split("\n").length : 0;

  return (
    /* Clicking the backdrop closes; Escape does the same from the keyboard. */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--tone-scrim)] p-6 backdrop-blur-sm sm:p-10"
      data-screenshot-hide
      onClick={onClose}
    >
      <div
        aria-label="what the stats command runs"
        aria-modal
        className="my-auto w-full max-w-3xl rounded-xl border border-veil/10 bg-ink-900/95 shadow-[0_40px_120px_-30px_var(--tone-shadow)] focus:outline-none"
        onClick={(event) => event.stopPropagation()}
        ref={panel}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 className="font-medium text-azure-100 text-xs">what it actually runs</h2>
            <p className="mt-3 text-mist-300 text-xs leading-[1.7]">
              It reads your machine's stats, opens this page with them in the URL
              fragment, and exits. Nothing is uploaded — the fragment never leaves
              your browser.
            </p>
          </div>
          <button
            aria-label="close"
            className="-mt-1 -mr-1 rounded p-1 text-mist-600 transition-colors hover:text-mist-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-azure/50"
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3 px-6">
          <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-veil/10 bg-ink-950/80 px-3 py-2 text-[13px] text-mist-100 whitespace-pre">
            {COMMAND}
          </code>
          <CopyButton label="copy command" text={() => COMMAND} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 px-6">
          <p className="text-[11px] text-mist-600">
            {source === null
              ? `fetching ${SCRIPT_PATH}…`
              : source.origin === "github"
                ? `${SCRIPT_PATH} · ${lines} lines · fetched from `
                : `${SCRIPT_PATH} · ${lines} lines · GitHub unreachable, showing the copy bundled with this page · verify at `}
            {source !== null && (
              <a
                className="text-mist-500 underline decoration-veil/20 underline-offset-2 transition-colors hover:text-azure-100"
                href={source.origin === "github" ? SCRIPT_RAW_URL : SCRIPT_BLOB_URL}
                rel="noreferrer"
                target="_blank"
              >
                github
              </a>
            )}
          </p>
          <CopyButton label="copy script" text={() => source?.text ?? ""} />
        </div>

        {/* The source itself: truncated until the chevron says otherwise. */}
        <div className="relative mt-3">
          <div
            className="overflow-y-auto overscroll-contain px-6"
            style={{ maxHeight: expanded ? "60vh" : COLLAPSED }}
          >
            <pre className="pb-6 text-[12px] leading-[1.65] text-mist-500 selection:bg-azure/30">
              {source === null ? "  loading…" : source.text}
            </pre>
          </div>
          {!expanded && (
            // Fades the cut edge instead of slicing a line in half.
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-900 to-transparent"
            />
          )}
        </div>

        {/* Full-width rule, chevron centred on it. */}
        <button
          aria-expanded={expanded}
          aria-label={expanded ? "collapse the script" : "expand the script"}
          className="group flex w-full items-center justify-center border-veil/10 border-t py-3 text-mist-600 transition-colors hover:bg-veil/3 hover:text-mist-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-azure/50"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          <span
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : "rotate-0"}`}
          >
            <ChevronIcon />
          </span>
        </button>
      </div>
    </div>
  );
}
