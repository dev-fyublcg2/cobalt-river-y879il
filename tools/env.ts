// Shared render environment: local browser binary, GL backend, paths. No network at render time.
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const p = (...parts: string[]) => path.join(ROOT, ...parts);

const CANDIDATES = [
  process.env.REMOTION_BROWSER,
  "/usr/local/lib/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell",
].filter(Boolean) as string[];

export const browserExecutable = CANDIDATES.find((c) => fs.existsSync(c)) ?? null;
export const chromiumOptions = { gl: "swangle" as const };
