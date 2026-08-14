import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Prefix-less so a plain IS_DEVELOPMENT=true in .env works; the values below
  // are the only things that reach the client.
  const env = loadEnv(mode, process.cwd(), "");
  const isDevelopment = env.IS_DEVELOPMENT ? env.IS_DEVELOPMENT === "true" : mode === "development";

  // Dev runs the site here, so the dev command tells the CLI to open this
  // instead of the deployed page.
  const port = 8200;

  return {
    server: { port },
    plugins: [react(), tailwindcss()],
    define: {
      __IS_DEVELOPMENT__: JSON.stringify(isDevelopment),
      // Absolute path to this checkout, so the dev command runs from anywhere.
      __PROJECT_ROOT__: JSON.stringify(process.cwd()),
      __SITE_URL__: JSON.stringify(isDevelopment ? `http://localhost:${port}` : ""),
    },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
  };
});
