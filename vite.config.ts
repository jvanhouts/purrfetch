import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ command, mode }) => {
  // Prefix-less so a plain IS_DEVELOPMENT=true in .env works; the values below
  // are the only things that reach the client.
  const env = loadEnv(mode, process.cwd(), "");

  // Only the dev server honours IS_DEVELOPMENT. A build is always a production
  // build: the flag lives in a committed-adjacent .env, and letting it through
  // here would bake this checkout's absolute path and a localhost URL into the
  // deployed site. `IS_DEVELOPMENT=false` still works for testing the real
  // command against `vite dev`.
  const isDevelopment =
    command === "serve" && (env.IS_DEVELOPMENT ? env.IS_DEVELOPMENT === "true" : true);

  // Dev runs the site here, so the dev command tells the CLI to open this
  // instead of the deployed page.
  const port = 8200;

  return {
    server: { port },
    plugins: [react(), tailwindcss()],
    define: {
      __IS_DEVELOPMENT__: JSON.stringify(isDevelopment),
      // Absolute path to this checkout, so the dev command runs from anywhere.
      // Empty in a build, so the path never reaches a deployed bundle.
      __PROJECT_ROOT__: JSON.stringify(isDevelopment ? process.cwd() : ""),
      __SITE_URL__: JSON.stringify(isDevelopment ? `http://localhost:${port}` : ""),
    },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
  };
});
