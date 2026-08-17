import { useCallback, useEffect, useState } from "react";
import { parsePayload } from "@/payload";

/**
 * Whether the clipboard is holding a purrfetch payload right now.
 *
 * "unknown" is the honest default: reading the clipboard needs the
 * `clipboard-read` permission, and only Chromium lets us ask whether we already
 * have it. Anywhere else — or before the user grants it — we never read and
 * never prompt, so the UI just falls back to its static hint.
 */
export type ClipboardState = "unknown" | "empty" | "ready";

async function hasSilentReadAccess(): Promise<boolean> {
  try {
    // Not in the spec's permission registry everywhere, so this throws on
    // Firefox and Safari rather than resolving — which is the answer we want.
    const status = await navigator.permissions.query({
      name: "clipboard-read" as PermissionName,
    });
    return status.state === "granted";
  } catch {
    return false;
  }
}

export function useClipboardPayload(): ClipboardState {
  const [state, setState] = useState<ClipboardState>("unknown");

  const check = useCallback(async () => {
    if (document.visibilityState !== "visible" || !document.hasFocus()) return;
    if (!(await hasSilentReadAccess())) {
      setState("unknown");
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      setState(parsePayload(text) ? "ready" : "empty");
    } catch {
      setState("unknown");
    }
  }, []);

  useEffect(() => {
    // Focus is the moment that matters: the user is coming back from the
    // terminal where they just ran the command.
    void check();
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [check]);

  return state;
}
