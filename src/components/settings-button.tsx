import { useEffect, useRef, useState } from "react";
import type { Theme } from "@/use-theme";

/** Lucide `settings`, at the toolbar's icon size. */
function GearIcon() {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "system" },
  { value: "light", label: "light" },
  { value: "dark", label: "dark" },
];

type Props = {
  theme: Theme;
  onTheme: (next: Theme) => void;
};

/** The settings tray. One setting so far, so it stays a small panel under the
 *  gear rather than a modal. */
export function SettingsButton({ theme, onTheme }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Escape closes, and so does anything clicked outside the tray.
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
        aria-label="settings"
        className={`rounded-lg border border-veil/10 bg-ink-900/70 px-2.5 py-2 backdrop-blur-md transition-colors hover:border-veil/20 hover:bg-ink-800/80 hover:text-mist-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-azure/50 ${
          open ? "text-mist-100" : "text-mist-300"
        }`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <GearIcon />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-40 mt-2 w-44 rounded-lg border border-veil/10 bg-ink-900/95 p-3 shadow-[0_30px_80px_-30px_var(--tone-shadow)] backdrop-blur-xl">
          <p className="mb-2 text-mist-600 text-[11px]">appearance</p>
          <div className="flex flex-col gap-1">
            {OPTIONS.map((option) => (
              <button
                aria-pressed={theme === option.value}
                className={`rounded-md px-2 py-1.5 text-left text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-azure/50 ${
                  theme === option.value
                    ? "bg-veil/10 text-azure-100"
                    : "text-mist-500 hover:bg-veil/6 hover:text-mist-100"
                }`}
                key={option.value}
                onClick={() => onTheme(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
