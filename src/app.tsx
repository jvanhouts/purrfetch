import { ImageDithering } from "@paper-design/shaders-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Backdrop, CAPTURABLE } from "@/components/backdrop";
import { CopyCommandButton } from "@/components/copy-command-button";
import { Field } from "@/components/field";
import { SaveScreenshotButton } from "@/components/save-screenshot-button";
import { SettingsButton } from "@/components/settings-button";
import { InfoButton } from "@/components/info-button";
import { Tutorial } from "@/components/tutorial";
import {
  parsePayload,
  parsePayloadFragment,
  type Payload,
  type Row,
} from "@/payload";
import { useClipboardPayload } from "@/use-clipboard-payload";
import { useTheme } from "@/use-theme";

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
  {
    id: "terminal-font",
    label: "terminal font",
    value: "BerkeleyMono-Regular 14",
  },
  { id: "cpu", label: "cpu", value: "Apple M4 Pro" },
  { id: "gpu", label: "gpu", value: "Apple M4 Pro" },
  { id: "memory", label: "memory", value: "4463MiB / 24576MiB" },
];

const SWATCHES = [
  [
    "#5f647d",
    "#f06a92",
    "#91d7a3",
    "#e6bd68",
    "#63a5f5",
    "#d982d2",
    "#56c7c2",
    "#d7dbe4",
  ],
  [
    "#777d99",
    "#ff7c9f",
    "#a8e6b5",
    "#f2cd78",
    "#7bb5ff",
    "#eb98df",
    "#72d8d2",
    "#f0f1f5",
  ],
];

export function App() {
  const [user, setUser] = useState("jess");
  const [title, setTitle] = useState("jess@Mac.home");
  const [rows, setRows] = useState(INITIAL_ROWS);
  const pageRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const [tutorial, setTutorial] = useState(false);
  const [filled, setFilled] = useState(false);
  const clipboard = useClipboardPayload();
  const { theme, setTheme, mode } = useTheme();
  const armed = clipboard === "ready" && !filled;

  const apply = useCallback((payload: Payload) => {
    if (payload.user) setUser(payload.user);
    if (payload.title) setTitle(payload.title);
    setRows(payload.rows);
    setFilled(true);
  }, []);

  // The happy path: the CLI opens this page at `/#s=<payload>`, so the stats
  // are already here and nothing needs pasting.
  useEffect(() => {
    const payload = parsePayloadFragment(window.location.hash);
    if (!payload) return;
    apply(payload);
    // Drop the fragment so a reload can't overwrite edits and a shared link
    // can't carry someone else's machine stats.
    history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
  }, [apply]);

  // The fallback path: no browser to open (ssh, headless), so the CLI leaves
  // the payload on the clipboard and pasting anywhere fills in the readout.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const payload = parsePayload(event.clipboardData?.getData("text") ?? "");
      if (!payload) return;
      event.preventDefault();
      apply(payload);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [apply]);

  const update = (id: string, patch: Partial<Row>) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center font-sans" ref={pageRef}>
      {/* The only thing on the page that moves. */}
      <Backdrop mode={mode} />

      <div className="fixed top-6 left-6 z-30 flex items-start gap-2" data-screenshot-hide>
        <SettingsButton onTheme={setTheme} theme={theme} />
        <div ref={copyRef}>
          <CopyCommandButton />
        </div>
        <SaveScreenshotButton cardRef={cardRef} pageRef={pageRef} />
      </div>

      <InfoButton busy={tutorial} onStart={() => setTutorial(true)} />

      {tutorial && (
        <Tutorial copyRef={copyRef} onClose={() => setTutorial(false)} />
      )}

      <div className="w-full max-w-5xl px-6 py-16">
        <section
          ref={cardRef}
          className={`w-full overflow-hidden rounded-2xl border bg-ink-900/80 font-mono shadow-[0_40px_120px_-40px_var(--tone-shadow)] backdrop-blur-xl transition-colors duration-500 ${
            armed ? "border-azure/40" : "border-veil/10"
          }`}
        >
          <header className="flex items-center gap-2 border-veil/8 border-b bg-veil/3 px-4 py-3">
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
            <p className="flex-1 text-center text-mist-600 text-xs tracking-wide">
              {user} — purrfetch
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
              <span className="text-rose"> ››› </span>
              <span className="text-mist-600">~/ </span>
              <span className="text-azure-100">purrfetch</span>
            </p>

            <div className="flex flex-wrap items-start gap-x-14 gap-y-10">
              {/* The logo, run through the same dither the background uses. */}
              <ImageDithering
                className="size-60 shrink-0 rounded-3xl"
                colorBack="#00000000"
                image="/icon.png"
                originalColors
                size={2}
                speed={0}
                type="4x4"
                webGlContextAttributes={CAPTURABLE}
              />

              <div className="min-w-0">
                <p className="font-medium">
                  <Field
                    ariaLabel="title"
                    className="text-azure-100"
                    onChange={setTitle}
                    value={title}
                  />
                </p>
                <div className="my-2 h-px w-full bg-veil/10" />

                <div className="space-y-0.5">
                  {rows.map((row) => (
                    <p key={row.id}>
                      <Field
                        ariaLabel={`${row.label} label`}
                        className="font-medium text-azure-100"
                        onChange={(label) => update(row.id, { label })}
                        value={row.label}
                      />
                      <span className="font-medium text-azure-100">:</span>{" "}
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
                        <div
                          className="size-9"
                          key={color}
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
