/**
 * The command the page tells you to run. With IS_DEVELOPMENT=true in .env it
 * points at this checkout by absolute path, so it works from any directory;
 * otherwise it's the published one-liner. Both values are baked in by
 * vite.config.ts at build time.
 */
declare const __IS_DEVELOPMENT__: boolean;
declare const __PROJECT_ROOT__: string;

export const COMMAND = __IS_DEVELOPMENT__
  ? `bun ${__PROJECT_ROOT__}/cli/index.ts`
  : "bunx github:jvanhouts/prettyfetch";
