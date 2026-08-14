import { Dithering, ImageDithering } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";
import { COMMAND } from "@/command";
import { CopyCommandButton } from "@/components/copy-command-button";
import { Field } from "@/components/field";
import { parsePayload, type Row } from "@/payload";
import { useClipboardPayload } from "@/use-clipboard-payload";

const INITIAL_ROWS: Row[] = [
  { id: "os", label: "os", value: "macOS 26.5.2 25F84 arm64" },
  { id: "host", label: "host", value: "Mac16,7" },
  { id: "uptime", label: "uptime", value: "19 days, 21 hours, 31 mins" },
  { id: "packages", label: "packages", value: "126 (brew)" },
  { id: "shell", label: "shell", value: "zsh 5.9" },
  { id: "resolution", label: "resolution", value: "1728x1117" },
  { id: "de", label: "de", value: "Aqua" },
  { id: "wm", label: "wm", value: "Quartz Compositor" },
  { id: "wm-theme", label: "wm theme", value: "Pink (Light)" },
  { id: "terminal-font", label: "terminal font", value: "BerkeleyMono-Regular 14" },
  { id: "cpu", label: "cpu", value: "Apple M4 Pro" },
  { id: "gpu", label: "gpu", value: "Apple M4 Pro" },
  { id: "memory", label: "memory", value: "4463MiB / 24576MiB" },
];

const SWATCHES = [
  ["#4c5168", "#e05561", "#8cc265", "#d5a44b", "#4d8bf5", "#e57fd0", "#48a3ad", "#a7b0bd"],
  ["#6b7189", "#ff7a85", "#a8dd84", "#f0c46a", "#74a5ff", "#f7a4e2", "#6cc7d1", "#d6dce4"],
];

export function App() {
  const [user, setUser] = useState("jess");
  const [title, setTitle] = useState("jess@Mac.home");
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [pasted, setPasted] = useState(false);
  const clipboard = useClipboardPayload();
  const armed = clipboard === "ready" && !pasted;
  const pasteKey = /mac/i.test(navigator.userAgent) ? "⌘V" : "ctrl+V";

  // `bunx github:jvanhouts/prettyfetch` puts a JSON payload on the clipboard;
  // pasting it anywhere on the page fills in the readout.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const payload = parsePayload(event.clipboardData?.getData("text") ?? "");
      if (!payload) return;
      event.preventDefault();
      if (payload.user) setUser(payload.user);
      if (payload.title) setTitle(payload.title);
      setRows(payload.rows);
      setPasted(true);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const update = (id: string, patch: Partial<Row>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  return (
    <main className="relative isolate min-h-full font-mono">
      {/* Ambient dither wash behind the window — the only thing on the page that moves. */}
      <Dithering
        className="-z-10 fixed inset-0 h-full w-full opacity-60"
        colorBack="#08090b"
        colorFront="#1d222a"
        shape="warp"
        size={2}
        speed={0.35}
        type="4x4"
      />

      <CopyCommandButton />

      <div className="mx-auto flex min-h-full max-w-5xl items-center px-6 py-16">
        <section
          className={`w-full overflow-hidden rounded-2xl border bg-ink-900/80 shadow-[0_40px_120px_-40px_#000] backdrop-blur-xl transition-colors duration-500 ${
            armed ? "border-green/40" : "border-white/10"
          }`}
        >
          <header className="flex items-center gap-2 border-white/8 border-b bg-white/3 px-4 py-3">
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
            <p className="flex-1 text-center text-mist-600 text-xs tracking-wide">
              {user} — prettyfetch
            </p>
            <span className="w-14" />

          </header>

          <div className="p-8 text-[15px] leading-[1.6]">
            <p className="mb-8">
              <Field
                ariaLabel="username"
                className="font-medium text-pink"
                onChange={setUser}
                value={user}
              />
              <span className="text-red"> ››› </span>
              <span className="text-mist-600">~/ </span>
              <span className="text-green">prettyfetch</span>
            </p>

            <div className="flex flex-wrap items-start gap-x-14 gap-y-10">
              {/* The logo, run through the same dither the background uses. */}
              <ImageDithering
                className="size-80 shrink-0"
                colorBack="#00000000"
                image="/logo.png"
                originalColors
                size={2}
                speed={0}
                type="4x4"
              />

              <div className="min-w-0">
                <p className="font-medium">
                  <span>🐱: </span>
                  <Field
                    ariaLabel="title"
                    className="text-cyan"
                    onChange={setTitle}
                    value={title}
                  />
                </p>
                <div className="my-2 h-px w-full bg-white/10" />

                <div className="space-y-0.5">
                  {rows.map((row) => (
                    <p key={row.id}>
                      <Field
                        ariaLabel={`${row.label} label`}
                        className="font-medium text-cyan"
                        onChange={(label) => update(row.id, { label })}
                        value={row.label}
                      />
                      <span className="font-medium text-cyan">:</span>{" "}
                      <Field
                        ariaLabel={`${row.label} value`}
                        className="text-mist-300"
                        onChange={(value) => update(row.id, { value })}
                        value={row.value}
                      />
                    </p>
                  ))}
                </div>

                <div className="mt-8 w-fit overflow-hidden rounded-lg">
                  {SWATCHES.map((swatchRow, rowIndex) => (
                    <div className="flex" key={rowIndex}>
                      {swatchRow.map((color) => (
                        <div className="size-9" key={color} style={{ background: color }} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 break-all text-mist-600 text-xs">
              {pasted && <span className="text-green">stats pasted — edit anything you like.</span>}

              {!pasted && armed && (
                <>
                  {/* Only shown when we could actually read the clipboard. */}
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-green" />
                  </span>
                  <span className="text-green">
                    stats on your clipboard — press {pasteKey} to drop them in.
                  </span>
                </>
              )}

              {!pasted && !armed && (
                <span>
                  run <span className="text-cyan">{COMMAND}</span> and paste here to fill this in.
                </span>
              )}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
