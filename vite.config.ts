import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Prefix-less so a plain IS_DEVELOPMENT=true in .env works; the values below
  // are the only things that reach the client.
  const env = loadEnv(mode, process.cwd(), "");
  const isDevelopment = env.IS_DEVELOPMENT ? env.IS_DEVELOPMENT === "true" : mode === "development";

  return {
    server: { port: 8200 },
    plugins: [react(), tailwindcss()],
    define: {
      __IS_DEVELOPMENT__: JSON.stringify(isDevelopment),
      // Absolute path to this checkout, so the dev command runs from anywhere.
      __PROJECT_ROOT__: JSON.stringify(process.cwd()),
    },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
  };
});
