# purrfetch

A neofetch-style system readout, rendered in your browser instead of the terminal.
Same fields, nicer typography.

```sh
npx purrfetch
```

Also `bunx purrfetch`, `pnpm dlx purrfetch`, `deno run -A npm:purrfetch`. There is
nothing to install and nothing to configure — it collects your stats, opens
<https://purrfetch.jess0x.dev> with them, and exits.

## Flags

| flag | what it does |
| --- | --- |
| `--no-open` | collect to the clipboard instead of opening a browser |
| `--url` | print the link instead of opening it |
| `--print` | print the payload as readable JSON |
| `--site <url>` | point at a different deployment (also `PURRFETCH_SITE`) |

## What it sends

Nothing. The stats ride in the URL's `#fragment`, which browsers never transmit
to a server — not in the request, not in the `Referer` header, not in any log.
They hold your username and hostname, so this is deliberate. Where there's no
browser to open (ssh, headless), the payload goes to your clipboard instead and
you paste it into the page yourself.

The whole thing is one 8 kB file with **zero dependencies**, and it shells out
only to stock system tools (`sysctl`, `sw_vers`, `uname`, `vm_stat`, `brew`,
`system_profiler` on macOS; `/proc`, `xrandr`, `lspci`, `dpkg-query` on Linux).
Every one of them is read-only. You can read the whole script from the page
itself — the "im too paranoid" button under the copy button shows you the source
it's built from, fetched live from this repo.

## Requirements

Node 18+ or any Bun. macOS and Linux are supported; on Windows only `--print`
and `--url` are likely to produce much.

## Development

```sh
bun install
bun run dev        # the web readout on :8200
bun cli/index.ts   # the collector, against the deployed site
bun run build      # typecheck + web build + bin/purrfetch.js
```

`bin/purrfetch.js` is the published artifact, built from `cli/index.ts`. It's
committed so the GitHub install path works, and rebuilt automatically on
`npm publish` via `prepublishOnly`.

## License

MIT
