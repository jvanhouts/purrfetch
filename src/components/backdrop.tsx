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

export function Backdrop() {
  const still = useReducedMotion();
  const shared = `absolute inset-0 h-full w-full ${VIGNETTE}`;

  return (
    <div className="-z-10 fixed inset-0 overflow-hidden bg-ink-950">
      {VARIANT === "aurora" && (
        // Slow bands of ink shot through with the mint and rose the readout
        // already uses, desaturated almost to black so they only just register.
        <GrainGradient
          className={`${shared} opacity-70`}
          colorBack="#0a0a0c"
          colors={["#101115", "#16362f", "#0f1218", "#34202f"]}
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
          colorBack="#0a0a0c"
          colorBloom="#1c4a3d"
          colors={["#4fe0a8", "#f072ab", "#2a2c32"]}
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
          colorBack="#0a0a0c"
          colorFront="#1f2126"
          shape="warp"
          size={2}
          speed={still ? 0 : 0.35}
          type="4x4"
          webGlContextAttributes={CAPTURABLE}
        />
      )}

      {/* Faint scanlines, so the whole page shares the logo's dithered grain. */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.035)_0px,rgba(255,255,255,0.035)_1px,transparent_1px,transparent_3px)]" />
    </div>
  );
}
