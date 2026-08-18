import { useCallback, useEffect, useState } from "react";

export type Theme = "system" | "light" | "dark";
/** What the page actually renders as once "system" has been resolved. */
export type Mode = "light" | "dark";

const KEY = "purrfetch:theme";

/** Storage throws in private mode and locked-down browsers — following the OS
 *  is a fine answer when it does. */
function read(): Theme {
  try {
    const stored = localStorage.getItem(KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function write(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {
    // The choice just won't survive a reload.
  }
}

const LIGHT_QUERY = "(prefers-color-scheme: light)";

/**
 * The page's colour mode. Every colour in the app is a token, so switching is
 * one attribute on `<html>` — matched by the inline script in `index.html`,
 * which sets it before first paint so there's no flash of the wrong mode.
 */
export function useTheme() {
  const [theme, setStored] = useState<Theme>(read);
  const [systemLight, setSystemLight] = useState(
    () => window.matchMedia(LIGHT_QUERY).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(LIGHT_QUERY);
    const onChange = (event: MediaQueryListEvent) => setSystemLight(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const mode: Mode = theme === "system" ? (systemLight ? "light" : "dark") : theme;

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    // Keeps scrollbars and form controls on the same side as the page.
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const setTheme = useCallback((next: Theme) => {
    setStored(next);
    write(next);
  }, []);

  return { theme, setTheme, mode };
}
