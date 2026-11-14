// G5/G6 still pass: one 3D still per shot (frame 0 pose, zoom = pushFrom) at 1.25x so the 2D push-in to 1.22 stays sharp.
// Cached by sha256(shot JSON + style + asset sources). Only changed shots re-render. Usage: render-stills.ts [S001 S002 ...]
import fs from "node:fs";
import crypto from "node:crypto";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import { browserExecutable, chromiumOptions, p } from "../env";

const shotlist = JSON.parse(fs.readFileSync(p("spec/shotlist.json"), "utf8"));
const only = process.argv.slice(2);
const srcHash = crypto.createHash("sha256");
for (const dir of ["assets/sets", "assets/avatars", "src/engine", "src/scenes", "assets/faces"]) for (const f of fs.readdirSync(p(dir)).sort()) srcHash.update(fs.readFileSync(p(dir, f)));
srcHash.update(fs.readFileSync(p("spec/style.json")));
const base = srcHash.digest("hex");
const keyOf = (s: any) => crypto.createHash("sha256").update(base + JSON.stringify(s)).digest("hex").slice(0, 16);

fs.mkdirSync(p("out/cache/stills"), { recursive: true });
const todo = shotlist.shots.filter((s: any) => (!only.length || only.includes(s.id)) && !fs.existsSync(p("out/cache/stills", keyOf(s) + ".png")));
const index: Record<string, string> = {};
for (const s of shotlist.shots) index[s.id] = `out/cache/stills/${keyOf(s)}.png`;
fs.writeFileSync(p("out/cache/stills/index.json"), JSON.stringify(index, null, 1));
console.log(`${todo.length} stills to render (cache hits are skipped)`);
if (todo.length) {
  fs.rmSync(p("out/bundle/public"), { recursive: true, force: true });
  const serveUrl = await bundle({ entryPoint: p("src/index.ts"), outDir: p("out/bundle"), publicDir: p("out/public") });
  const browser = await openBrowser("chrome", { browserExecutable, chromiumOptions });
  const timings: Record<string, number> = {};
  for (const s of todo) {
    const t = Date.now();
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const comp = await selectComposition({ serveUrl, id: `shot-${s.id}`, puppeteerInstance: browser, chromiumOptions, inputProps: { shotId: s.id, still: true } });
        await renderStill({ serveUrl, composition: comp, output: p("out/cache/stills", keyOf(s) + ".png"), frame: 0, puppeteerInstance: browser, chromiumOptions, inputProps: { shotId: s.id, still: true } });
        break;
      } catch (e) { console.error(`${s.id} attempt ${attempt} failed: ${(e as Error).message}`); if (attempt === 3) throw e; }
    }
    timings[s.id] = Date.now() - t;
    console.log(s.id, timings[s.id], "ms");
  }
  await browser.close({ silent: true });
  fs.writeFileSync(p("out/cache/stills/timings.json"), JSON.stringify(timings, null, 1));
}
