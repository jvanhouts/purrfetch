import { toCanvas } from "html-to-image";
import { type RefObject, useEffect, useRef, useState } from "react";

/** Lucide `download`. */
function DownloadIcon() {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
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

/** Retina-ish output, and how much backdrop to leave around the window. The
 *  margin doubles as the frame's corner radius offset. */
const SCALE = 2;
const MARGIN = 56;

type Props = {
  /** The window to frame. */
  cardRef: RefObject<HTMLElement | null>;
  /** Everything, including the backdrop the window sits on. */
  pageRef: RefObject<HTMLElement | null>;
};

/**
 * Saves a PNG of the readout with a little of the backdrop around it.
 *
 * The whole page is rasterised and then cropped, rather than the window alone:
 * that's what gets the real shader behind it — including the radial mask that
 * fades it out toward the middle — instead of a flat fill pretending to be it.
 */
export function SaveScreenshotButton({ cardRef, pageRef }: Props) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const save = async () => {
    const page = pageRef.current;
    const card = cardRef.current;
    if (!page || !card || busy) return;

    setBusy(true);
    try {
      const pageCanvas = await toCanvas(page, {
        backgroundColor: "#0a0a0c",
        pixelRatio: SCALE,
        // The buttons are page furniture, not part of the readout.
        filter: (node) => !(node instanceof HTMLElement && node.dataset.screenshotHide !== undefined),
      });

      const pageBox = page.getBoundingClientRect();
      const cardBox = card.getBoundingClientRect();
      const left = Math.max(0, cardBox.left - pageBox.left - MARGIN);
      const top = Math.max(0, cardBox.top - pageBox.top - MARGIN);
      const width = Math.min(cardBox.width + MARGIN * 2, pageBox.width - left);
      const height = Math.min(cardBox.height + MARGIN * 2, pageBox.height - top);

      const out = document.createElement("canvas");
      out.width = Math.round(width * SCALE);
      out.height = Math.round(height * SCALE);
      const ctx = out.getContext("2d");
      if (!ctx) return;

      // Round the frame concentrically with the window inside it: same centre
      // of curvature, so the two arcs stay parallel across the margin.
      const cardRadius = Number.parseFloat(getComputedStyle(card).borderTopLeftRadius) || 0;
      ctx.beginPath();
      ctx.roundRect(0, 0, out.width, out.height, (cardRadius + MARGIN) * SCALE);
      ctx.clip();

      ctx.drawImage(
        pageCanvas,
        Math.round(left * SCALE),
        Math.round(top * SCALE),
        out.width,
        out.height,
        0,
        0,
        out.width,
        out.height,
      );

      const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/png"));
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "prettyfetch.png";
      link.click();
      URL.revokeObjectURL(url);

      setSaved(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setSaved(false), 2000);
    } catch {
      // Nothing useful to offer if rasterising fails — leave the button be.
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      aria-label={saved ? "screenshot saved" : "save a screenshot"}
      className="group rounded-lg border border-white/10 bg-ink-900/70 px-3 py-2 text-xs backdrop-blur-md transition-colors hover:border-white/20 hover:bg-ink-800/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mint/50 disabled:opacity-60"
      disabled={busy}
      onClick={save}
      type="button"
    >
      <span className="grid items-center">
        <span
          aria-hidden
          className={`col-start-1 row-start-1 flex items-center gap-2 text-mist-300 transition-all duration-200 group-hover:text-mist-100 ${
            saved ? "-translate-y-1 opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          {busy ? "saving…" : "save screenshot"}
          <DownloadIcon />
        </span>
        <span
          aria-hidden
          className={`col-start-1 row-start-1 flex items-center gap-2 text-mint transition-all duration-200 ${
            saved ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          }`}
        >
          screenshot saved
          <CheckIcon />
        </span>
      </span>
    </button>
  );
}
