export type Row = { id: string; label: string; value: string };

export type Payload = {
  prettyfetch: 1;
  user: string;
  title: string;
  rows: Row[];
};

/** Parses clipboard text from the CLI, returning null when it isn't a prettyfetch payload. */
export function parsePayload(text: string): Payload | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;

  const candidate = parsed as Record<string, unknown>;
  if (candidate.prettyfetch !== 1 || !Array.isArray(candidate.rows)) return null;

  const rows: Row[] = [];
  for (const entry of candidate.rows) {
    if (typeof entry !== "object" || entry === null) continue;
    const row = entry as Record<string, unknown>;
    if (typeof row.label !== "string" || typeof row.value !== "string") continue;
    rows.push({
      id: typeof row.id === "string" ? row.id : `row-${rows.length}`,
      label: row.label,
      value: row.value,
    });
  }
  if (rows.length === 0) return null;

  return {
    prettyfetch: 1,
    user: typeof candidate.user === "string" ? candidate.user : "",
    title: typeof candidate.title === "string" ? candidate.title : "",
    rows,
  };
}

/**
 * Decodes the `#s=<base64url>` fragment the CLI opens the browser with. The
 * payload rides in the fragment rather than the query string so it never
 * reaches the server, our logs, or a `Referer` header — it holds the user's
 * hostname and username.
 */
export function parsePayloadFragment(hash: string): Payload | null {
  const encoded = new URLSearchParams(hash.replace(/^#/, "")).get("s");
  if (!encoded) return null;
  try {
    const binary = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return parsePayload(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}
