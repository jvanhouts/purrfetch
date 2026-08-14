#!/usr/bin/env bun
/**
 * prettyfetch — collects the stats the web readout wants and opens them in
 * https://prettyfetch.pages.dev. Where there's no browser to open (ssh,
 * headless, --no-open) it falls back to leaving the JSON on the clipboard.
 *
 * Run it with: bunx github:jvanhouts/prettyfetch
 *
 * Flags: --no-open  collect to the clipboard, don't open a browser
 *        --url      print the link instead of opening it
 *        --print    print the payload as readable JSON
 *        --site U   point at a different deployment (also: PRETTYFETCH_SITE)
 */

type Row = { id: string; label: string; value: string };

type Payload = {
  prettyfetch: 1;
  user: string;
  title: string;
  rows: Row[];
};

/** Runs a command and returns trimmed stdout, or "" if it isn't available here. */
function sh(cmd: string[]): string {
  try {
    const result = Bun.spawnSync(cmd, { stdout: "pipe", stderr: "ignore" });
    return result.success ? new TextDecoder().decode(result.stdout).trim() : "";
  } catch {
    return "";
  }
}

function sysctl(key: string): string {
  return sh(["sysctl", "-n", key]);
}

function firstMatch(text: string, pattern: RegExp): string {
  return text.match(pattern)?.[1]?.trim() ?? "";
}

function formatDuration(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const parts: string[] = [];
  if (days) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  if (hours) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  parts.push(`${mins} ${mins === 1 ? "min" : "mins"}`);
  return parts.join(", ");
}

function uptime(): string {
  if (process.platform === "darwin") {
    // kern.boottime looks like: { sec = 1755100000, usec = 0 } Fri Aug 15 ...
    const boot = Number(firstMatch(sysctl("kern.boottime"), /sec\s*=\s*(\d+)/));
    if (boot) return formatDuration(Math.floor(Date.now() / 1000) - boot);
    return "";
  }
  const seconds = Number(readFileOrEmpty("/proc/uptime").split(" ")[0]);
  return seconds ? formatDuration(Math.floor(seconds)) : "";
}

function readFileOrEmpty(path: string): string {
  try {
    return require("node:fs").readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

/** Counts installed packages across whichever managers are present. */
function packages(): string {
  const counts: string[] = [];
  const count = (cmd: string[], name: string, skipHeaderLines = 0) => {
    const out = sh(cmd);
    if (!out) return;
    const lines = out.split("\n").filter(Boolean).length - skipHeaderLines;
    if (lines > 0) counts.push(`${lines} (${name})`);
  };
  count(["brew", "list", "--formula"], "brew");
  count(["pacman", "-Qq"], "pacman");
  count(["dpkg-query", "-f", "${binary:Package}\n", "-W"], "dpkg");
  count(["rpm", "-qa"], "rpm");
  return counts.join(", ");
}

function osName(): string {
  const arch = sh(["uname", "-m"]);
  if (process.platform === "darwin") {
    const name = sh(["sw_vers", "-productName"]) || "macOS";
    const version = sh(["sw_vers", "-productVersion"]);
    const build = sh(["sw_vers", "-buildVersion"]);
    return [name, version, build, arch].filter(Boolean).join(" ");
  }
  const release = readFileOrEmpty("/etc/os-release");
  const pretty = firstMatch(release, /PRETTY_NAME="?([^"\n]+)"?/);
  return [pretty || sh(["uname", "-s"]), arch].filter(Boolean).join(" ");
}

function displayInfo(): { resolution: string; gpu: string } {
  if (process.platform !== "darwin") {
    const resolution = firstMatch(sh(["xrandr", "--current"]), /connected(?:\s+primary)?\s+(\d+x\d+)/);
    return { resolution, gpu: firstMatch(sh(["lspci"]), /VGA compatible controller:\s*(.+)/) };
  }
  // The plist output is verbose but stable, and avoids parsing localized labels.
  const raw = sh(["system_profiler", "-json", "SPDisplaysDataType"]);
  try {
    const cards = JSON.parse(raw).SPDisplaysDataType ?? [];
    const card = cards[0] ?? {};
    const screen = (card.spdisplays_ndrvs ?? [])[0] ?? {};
    const resolution = firstMatch(
      String(screen._spdisplays_resolution ?? screen.spdisplays_resolution ?? ""),
      /(\d+\s*x\s*\d+)/,
    ).replace(/\s+/g, "");
    return { resolution, gpu: String(card.sppci_model ?? "") };
  } catch {
    return { resolution: "", gpu: "" };
  }
}

function memory(): string {
  const totalBytes = Number(sysctl("hw.memsize")) || 0;
  const totalMiB = Math.round(totalBytes / 1024 / 1024);
  if (process.platform === "darwin") {
    const stat = sh(["vm_stat"]);
    const pageSize = Number(firstMatch(stat, /page size of (\d+) bytes/)) || 4096;
    const pagesOf = (name: string) => Number(firstMatch(stat, new RegExp(`${name}:\\s+(\\d+)`))) || 0;
    // Roughly what the Activity Monitor calls "used": everything but free + purgeable.
    const used =
      (pagesOf("Pages active") + pagesOf("Pages wired down") + pagesOf("Pages occupied by compressor")) *
      pageSize;
    if (!totalMiB) return "";
    return `${Math.round(used / 1024 / 1024)}MiB / ${totalMiB}MiB`;
  }
  const meminfo = readFileOrEmpty("/proc/meminfo");
  const kb = (name: string) => Number(firstMatch(meminfo, new RegExp(`${name}:\\s+(\\d+) kB`))) || 0;
  const total = kb("MemTotal");
  if (!total) return "";
  return `${Math.round((total - kb("MemAvailable")) / 1024)}MiB / ${Math.round(total / 1024)}MiB`;
}

function appearance(): string {
  if (process.platform !== "darwin") return "";
  const dark = sh(["defaults", "read", "-g", "AppleInterfaceStyle"]) === "Dark";
  const accents = [
    "Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Pink",
  ];
  const accentIndex = Number(sh(["defaults", "read", "-g", "AppleAccentColor"]));
  const accent = accents[accentIndex] ?? "Multicolor";
  return `${accent} (${dark ? "Dark" : "Light"})`;
}

function collect(): Payload {
  const user = process.env.USER || process.env.LOGNAME || "user";
  const hostname = sh(["hostname"]) || "localhost";
  const shell = (() => {
    const path = process.env.SHELL ?? "";
    const name = path.split("/").pop() ?? "";
    if (!name) return "";
    const version = firstMatch(sh([path, "--version"]), /(\d+\.[\d.]+)/);
    return [name, version].filter(Boolean).join(" ");
  })();
  const { resolution, gpu } = displayInfo();
  const isMac = process.platform === "darwin";

  const rows: Row[] = [
    { id: "os", label: "os", value: osName() },
    { id: "host", label: "host", value: isMac ? sysctl("hw.model") : sh(["uname", "-n"]) },
    { id: "uptime", label: "uptime", value: uptime() },
    { id: "packages", label: "packages", value: packages() },
    { id: "shell", label: "shell", value: shell },
    { id: "resolution", label: "resolution", value: resolution },
    { id: "de", label: "de", value: isMac ? "Aqua" : process.env.XDG_CURRENT_DESKTOP ?? "" },
    { id: "wm", label: "wm", value: isMac ? "Quartz Compositor" : process.env.XDG_SESSION_TYPE ?? "" },
    { id: "wm-theme", label: "wm theme", value: appearance() },
    { id: "terminal", label: "terminal", value: process.env.TERM_PROGRAM ?? process.env.TERM ?? "" },
    { id: "cpu", label: "cpu", value: sysctl("machdep.cpu.brand_string") || firstMatch(readFileOrEmpty("/proc/cpuinfo"), /model name\s*:\s*(.+)/) },
    { id: "gpu", label: "gpu", value: gpu },
    { id: "memory", label: "memory", value: memory() },
  ];

  return {
    prettyfetch: 1,
    user,
    title: `${user}@${hostname}`,
    rows: rows.filter((row) => row.value !== ""),
  };
}

/** Writes to the system clipboard; returns false when no clipboard tool exists. */
function copyToClipboard(text: string): boolean {
  const candidates =
    process.platform === "darwin"
      ? [["pbcopy"]]
      : [["wl-copy"], ["xclip", "-selection", "clipboard"], ["xsel", "--clipboard", "--input"]];
  for (const cmd of candidates) {
    try {
      const result = Bun.spawnSync(cmd, { stdin: Buffer.from(text), stdout: "ignore", stderr: "ignore" });
      if (result.success) return true;
    } catch {
      // Try the next tool.
    }
  }
  return false;
}

const SITE = "https://prettyfetch.pages.dev";

function siteUrl(): string {
  const flag = process.argv.indexOf("--site");
  const fromFlag = flag === -1 ? "" : process.argv[flag + 1] ?? "";
  return (fromFlag || process.env.PRETTYFETCH_SITE || SITE).replace(/\/+$/, "");
}

/** Whether there's a desktop browser here to hand the link to. */
function hasDesktopBrowser(): boolean {
  // Over ssh the browser would open on the wrong machine entirely.
  if (process.env.SSH_TTY || process.env.SSH_CONNECTION) return false;
  if (process.platform === "linux") {
    return Boolean(process.env.DISPLAY || process.env.WAYLAND_DISPLAY);
  }
  return true;
}

function openInBrowser(url: string): boolean {
  const cmd =
    process.platform === "darwin"
      ? ["open", url]
      : process.platform === "win32"
        ? ["cmd", "/c", "start", "", url]
        : ["xdg-open", url];
  try {
    // No shell involved, so the `#` in the url needs no escaping.
    return Bun.spawnSync(cmd, { stdout: "ignore", stderr: "ignore" }).success;
  } catch {
    return false;
  }
}

const payload = collect();
const json = JSON.stringify(payload);
const count = payload.rows.length;

// The payload rides in the fragment, which browsers never send to the server —
// it carries the user's hostname and username.
const url = `${siteUrl()}/#s=${Buffer.from(json, "utf8").toString("base64url")}`;

const wantsUrl = process.argv.includes("--url");
const wantsOpen = !wantsUrl && !process.argv.includes("--no-open");

if (process.argv.includes("--print") || process.argv.includes("--stdout")) {
  console.log(JSON.stringify(payload, null, 2));
} else if (wantsUrl) {
  console.log(url);
} else if (wantsOpen && hasDesktopBrowser() && openInBrowser(url)) {
  console.log(`\n  opening ${count} stats in your browser.\n`);
} else if (copyToClipboard(json)) {
  console.log(`\n  copied ${count} stats to your clipboard.`);
  console.log(`  paste them into ${siteUrl()} with cmd+v.\n`);
} else {
  console.error("  no browser or clipboard tool found — printing instead:\n");
  console.log(json);
}
