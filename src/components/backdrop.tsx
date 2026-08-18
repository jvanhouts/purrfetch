import { Dithering, GodRays, GrainGradient } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";

/**
 * Which ambient backdrop the page renders. Three tuned options while we settle
 * on one — flip this and reload.
 */
const VARIANT: "aurora" | "rays" | "dither" = "aurora";

/**
 * WebGL throws its drawing buffer away after each present, so a canvas read
 * back later — as the screenshot does — comes out blank. Every shader on the
 * page opts into keeping it.
 */
export const CAPTURABLE: WebGLContextAttributes = { preserveDrawingBuffer: true };

/**
 * Keeps the middle of the screen near-black so the readout never competes with
 * the shader behind it; all the colour lives out at the edges.
 */
const VIGNETTE = "[mask-image:radial-gradient(115%_85%_at_50%_45%,transparent_20%,black_72%)]";

/** Background motion is decoration, so it stops when the OS asks it to. */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/** The shader palettes, one per mode — the only colours on the page that can't
 *  come from a CSS token, since they're uniforms handed to WebGL. */
const PALETTE = {
  dark: {
    back: "#0a0a0c",
    aurora: ["#101115", "#152744", "#0f1218", "#34202f"],
    bloom: "#1d3566",
    rays: ["#5181f9", "#f072ab", "#2a2c32"],
    ditherFront: "#1f2126",
  },
  light: {
    back: "#eef0f3",
    aurora: ["#ffffff", "#dde5fb", "#eef0f3", "#f7e2ec"],
    bloom: "#d3dffb",
    rays: ["#2f5fd0", "#cf3d8e", "#dcdfe5"],
    ditherFront: "#d7dbe2",
  },
} as const;

export function Backdrop({ mode }: { mode: "light" | "dark" }) {
  const still = useReducedMotion();
  const palette = PALETTE[mode];
  const shared = `absolute inset-0 h-full w-full ${VIGNETTE}`;

  return (
    <div className="-z-10 fixed inset-0 overflow-hidden bg-ink-950">
      {VARIANT === "aurora" && (
        // Slow bands of ink shot through with the azure and rose the readout
        // already uses, desaturated almost to black so they only just register.
        <GrainGradient
          className={`${shared} opacity-70`}
          colorBack={palette.back}
          colors={[...palette.aurora]}
          intensity={0.28}
          noise={0.4}
          shape="wave"
          softness={1}
          webGlContextAttributes={CAPTURABLE}
          speed={still ? 0 : 0.18}
        />
      )}

      {VARIANT === "rays" && (
        // A single soft light source off the top-left corner.
        <GodRays
          bloom={0.35}
          className={`${shared} opacity-55`}
          colorBack={palette.back}
          colorBloom={palette.bloom}
          colors={[...palette.rays]}
          density={0.4}
          intensity={0.22}
          offsetX={-0.65}
          offsetY={-0.75}
          speed={still ? 0 : 0.12}
          spotty={0.15}
          webGlContextAttributes={CAPTURABLE}
        />
      )}

      {VARIANT === "dither" && (
        <Dithering
          className={`${shared} opacity-60`}
          colorBack={palette.back}
          colorFront={palette.ditherFront}
          shape="warp"
          size={2}
          speed={still ? 0 : 0.35}
          type="4x4"
          webGlContextAttributes={CAPTURABLE}
        />
      )}

      {/* Faint scanlines, so the whole page shares the logo's dithered grain. */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,var(--tone-scanline)_0px,var(--tone-scanline)_1px,transparent_1px,transparent_3px)]" />
    </div>
  );
}
