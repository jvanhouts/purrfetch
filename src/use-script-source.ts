import { useEffect, useState } from "react";
import { loadScript, type ScriptSource } from "@/script-source";

/**
 * The CLI script's text, fetched the first time something asks for it.
 * `null` while it's in flight — it always resolves, never rejects.
 */
export function useScriptSource(enabled: boolean): ScriptSource | null {
  const [source, setSource] = useState<ScriptSource | null>(null);

  useEffect(() => {
    if (!enabled || source) return;
    let cancelled = false;
    void loadScript().then((result) => {
      if (!cancelled) setSource(result);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, source]);

  return source;
}
