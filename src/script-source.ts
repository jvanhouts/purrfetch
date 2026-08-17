import bundled from "../cli/index.ts?raw";

/**
 * The source `npx purrfetch` is built from.
 *
 * It's fetched from GitHub rather than baked in, because a baked-in snapshot is
 * exactly what a paranoid reader can't trust: it would only prove this page
 * ships some text, not that the text is what the package is built from. The
 * bundled copy is the fallback for when the network says no, and the UI labels
 * it as the fallback when it's used.
 *
 * Note this is the TypeScript source, not the transpiled `bin/purrfetch.js`
 * that npm actually serves — readable, and a straight one-to-one build of it.
 */
export const REPO = "jvanhouts/purrfetch";
export const BRANCH = "main";
export const SCRIPT_PATH = "cli/index.ts";

export const SCRIPT_RAW_URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${SCRIPT_PATH}`;
export const SCRIPT_BLOB_URL = `https://github.com/${REPO}/blob/${BRANCH}/${SCRIPT_PATH}`;

/** Where the shown text came from, so the modal can say which it is. */
export type SourceOrigin = "github" | "bundled";

export type ScriptSource = { text: string; origin: SourceOrigin };

async function fetchScript(): Promise<ScriptSource> {
  try {
    const response = await fetch(SCRIPT_RAW_URL);
    if (!response.ok) throw new Error(String(response.status));
    return { text: await response.text(), origin: "github" };
  } catch {
    // Repo not public yet, offline, rate-limited — show the copy that shipped
    // with the page rather than an empty box.
    return { text: bundled, origin: "bundled" };
  }
}

/** One fetch per page load, however many times the modal is opened. */
let pending: Promise<ScriptSource> | null = null;

export function loadScript(): Promise<ScriptSource> {
  pending ??= fetchScript();
  return pending;
}
