#!/usr/bin/env node

// cli/index.ts
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
function sh([file, ...args]) {
  if (!file)
    return "";
  try {
    const result = spawnSync(file, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return result.status === 0 ? (result.stdout ?? "").trim() : "";
  } catch {
    return "";
  }
}
function sysctl(key) {
  return sh(["sysctl", "-n", key]);
}
function firstMatch(text, pattern) {
  return text.match(pattern)?.[1]?.trim() ?? "";
}
function formatDuration(totalSeconds) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor(totalSeconds % 86400 / 3600);
  const mins = Math.floor(totalSeconds % 3600 / 60);
  const parts = [];
  if (days)
    parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  if (hours)
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  parts.push(`${mins} ${mins === 1 ? "min" : "mins"}`);
  return parts.join(", ");
}
function uptime() {
  if (process.platform === "darwin") {
    const boot = Number(firstMatch(sysctl("kern.boottime"), /sec\s*=\s*(\d+)/));
    if (boot)
      return formatDuration(Math.floor(Date.now() / 1000) - boot);
    return "";
  }
  const seconds = Number(readFileOrEmpty("/proc/uptime").split(" ")[0]);
  return seconds ? formatDuration(Math.floor(seconds)) : "";
}
function readFileOrEmpty(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}
function packages() {
  const counts = [];
  const count = (cmd, name, skipHeaderLines = 0) => {
    const out = sh(cmd);
    if (!out)
      return;
    const lines = out.split(`
`).filter(Boolean).length - skipHeaderLines;
    if (lines > 0)
      counts.push(`${lines} (${name})`);
  };
  count(["brew", "list", "--formula"], "brew");
  count(["pacman", "-Qq"], "pacman");
  count(["dpkg-query", "-f", "${binary:Package}\n", "-W"], "dpkg");
  count(["rpm", "-qa"], "rpm");
  return counts.join(", ");
}
function osName() {
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
function displayInfo() {
  if (process.platform !== "darwin") {
    const resolution = firstMatch(sh(["xrandr", "--current"]), /connected(?:\s+primary)?\s+(\d+x\d+)/);
    return { resolution, gpu: firstMatch(sh(["lspci"]), /VGA compatible controller:\s*(.+)/) };
  }
  const raw = sh(["system_profiler", "-json", "SPDisplaysDataType"]);
  try {
    const cards = JSON.parse(raw).SPDisplaysDataType ?? [];
    const card = cards[0] ?? {};
    const screen = (card.spdisplays_ndrvs ?? [])[0] ?? {};
    const resolution = firstMatch(String(screen._spdisplays_resolution ?? screen.spdisplays_resolution ?? ""), /(\d+\s*x\s*\d+)/).replace(/\s+/g, "");
    return { resolution, gpu: String(card.sppci_model ?? "") };
  } catch {
    return { resolution: "", gpu: "" };
  }
}
function memory() {
  const totalBytes = Number(sysctl("hw.memsize")) || 0;
  const totalMiB = Math.round(totalBytes / 1024 / 1024);
  if (process.platform === "darwin") {
    const stat = sh(["vm_stat"]);
    const pageSize = Number(firstMatch(stat, /page size of (\d+) bytes/)) || 4096;
    const pagesOf = (name) => Number(firstMatch(stat, new RegExp(`${name}:\\s+(\\d+)`))) || 0;
    const used = (pagesOf("Pages active") + pagesOf("Pages wired down") + pagesOf("Pages occupied by compressor")) * pageSize;
    if (!totalMiB)
      return "";
    return `${Math.round(used / 1024 / 1024)}MiB / ${totalMiB}MiB`;
  }
  const meminfo = readFileOrEmpty("/proc/meminfo");
  const kb = (name) => Number(firstMatch(meminfo, new RegExp(`${name}:\\s+(\\d+) kB`))) || 0;
  const total = kb("MemTotal");
  if (!total)
    return "";
  return `${Math.round((total - kb("MemAvailable")) / 1024)}MiB / ${Math.round(total / 1024)}MiB`;
}
function appearance() {
  if (process.platform !== "darwin")
    return "";
  const dark = sh(["defaults", "read", "-g", "AppleInterfaceStyle"]) === "Dark";
  const accents = [
    "Red",
    "Orange",
    "Yellow",
    "Green",
    "Blue",
    "Purple",
    "Pink"
  ];
  const accentIndex = Number(sh(["defaults", "read", "-g", "AppleAccentColor"]));
  const accent = accents[accentIndex] ?? "Multicolor";
  return `${accent} (${dark ? "Dark" : "Light"})`;
}
function collect() {
  const user = process.env.USER || process.env.LOGNAME || "user";
  const hostname = sh(["hostname"]) || "localhost";
  const shell = (() => {
    const path = process.env.SHELL ?? "";
    const name = path.split("/").pop() ?? "";
    if (!name)
      return "";
    const version = firstMatch(sh([path, "--version"]), /(\d+\.[\d.]+)/);
    return [name, version].filter(Boolean).join(" ");
  })();
  const { resolution, gpu } = displayInfo();
  const isMac = process.platform === "darwin";
  const rows = [
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
    { id: "memory", label: "memory", value: memory() }
  ];
  return {
    purrfetch: 1,
    user,
    title: `${user}@${hostname}`,
    rows: rows.filter((row) => row.value !== "")
  };
}
function copyToClipboard(text) {
  const candidates = process.platform === "darwin" ? [["pbcopy"]] : [["wl-copy"], ["xclip", "-selection", "clipboard"], ["xsel", "--clipboard", "--input"]];
  for (const [file, ...args] of candidates) {
    if (!file)
      continue;
    try {
      const result = spawnSync(file, args, { input: text, stdio: ["pipe", "ignore", "ignore"] });
      if (result.status === 0)
        return true;
    } catch {}
  }
  return false;
}
var SITE = "https://purrfetch.jess0x.dev";
function siteUrl() {
  const flag = process.argv.indexOf("--site");
  const fromFlag = flag === -1 ? "" : process.argv[flag + 1] ?? "";
  return (fromFlag || process.env.PURRFETCH_SITE || SITE).replace(/\/+$/, "");
}
function hasDesktopBrowser() {
  if (process.env.SSH_TTY || process.env.SSH_CONNECTION)
    return false;
  if (process.platform === "linux") {
    return Boolean(process.env.DISPLAY || process.env.WAYLAND_DISPLAY);
  }
  return true;
}
function openInBrowser(url) {
  const [file, ...args] = process.platform === "darwin" ? ["open", url] : process.platform === "win32" ? ["cmd", "/c", "start", "", url] : ["xdg-open", url];
  if (!file)
    return false;
  try {
    return spawnSync(file, args, { stdio: "ignore" }).status === 0;
  } catch {
    return false;
  }
}
var payload = collect();
var json = JSON.stringify(payload);
var count = payload.rows.length;
var url = `${siteUrl()}/#s=${Buffer.from(json, "utf8").toString("base64url")}`;
var wantsUrl = process.argv.includes("--url");
var wantsOpen = !wantsUrl && !process.argv.includes("--no-open");
if (process.argv.includes("--print") || process.argv.includes("--stdout")) {
  console.log(JSON.stringify(payload, null, 2));
} else if (wantsUrl) {
  console.log(url);
} else if (wantsOpen && hasDesktopBrowser() && openInBrowser(url)) {
  console.log(`
  opening ${count} stats in your browser.
`);
} else if (copyToClipboard(json)) {
  console.log(`
  copied ${count} stats to your clipboard.`);
  console.log(`  paste them into ${siteUrl()} with cmd+v.
`);
} else {
  console.error(`  no browser or clipboard tool found — printing instead:
`);
  console.log(json);
}
