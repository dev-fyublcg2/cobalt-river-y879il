// Animated pass: per-shot 3D samples of the held-pose micro-moves (breath bob, torso sway, arm settle/swing, head turn).
// Each shot renders its own samples at render.animFps, t = k / animFps, with the last sample clamped onto the shot end,
// at the full 1080x1920 with the lens fixed at zoomFrom. assemble.ts blends neighbouring samples to 60 fps INSIDE the
// shot (cuts stay hard) and applies the push-in at 60 fps. Efficiency trade-off logged in spec/decisions.md.
// Cached per shot by sha256("anim" + sources + style + shot JSON); only missing shots render. Usage: render-anim.ts [S001 ...]
import fs from "node:fs";
import crypto from "node:crypto";
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition, openBrowser } from "@remotion/renderer";
import { browserExecutable, chromiumOptions, p } from "../env";

const sl = JSON.parse(fs.readFileSync(p("spec/shotlist.json"), "utf8"));
const style = JSON.parse(fs.readFileSync(p("spec/style.json"), "utf8"));
const FPS_A: number = style.render.animFps;
const only = process.argv.slice(2);
const h = crypto.createHash("sha256");
for (const dir of ["assets/sets", "assets/avatars", "src/engine", "src/scenes", "assets/faces"]) for (const f of fs.readdirSync(p(dir)).sort()) h.update(fs.readFileSync(p(dir, f)));
h.update(fs.readFileSync(p("spec/style.json")));
const base = h.digest("hex");
const keyOf = (s: any) => crypto.createHash("sha256").update("anim" + base + JSON.stringify(s)).digest("hex").slice(0, 16);
export const sampleTimes = (dur: number) => {
  const n = Math.ceil(dur * FPS_A - 1e-9) + 1;
  return Array.from({ length: n }, (_, k) => Math.min(dur, k / FPS_A));
};

fs.mkdirSync(p("out/cache/anim"), { recursive: true });
const index: Record<string, { dir: string; times: number[] }> = {};
for (const s of sl.shots) index[s.id] = { dir: `out/cache/anim/${keyOf(s)}`, times: sampleTimes(s.dur) };
fs.writeFileSync(p("out/cache/anim/index.json"), JSON.stringify(index, null, 1));
const done = (s: any) => fs.existsSync(p(index[s.id].dir, "done"));
const todo = sl.shots.filter((s: any) => (!only.length || only.includes(s.id)) && !done(s));
console.log(`${todo.length} animated shots to render (${todo.reduce((a: number, s: any) => a + index[s.id].times.length, 0)} samples)`);
if (todo.length) {
  fs.rmSync(p("out/bundle/public"), { recursive: true, force: true });
  const serveUrl = await bundle({ entryPoint: p("src/index.ts"), outDir: p("out/bundle"), publicDir: p("out/public") });
  const browser = await openBrowser("chrome", { browserExecutable, chromiumOptions });
  const timingsPath = p("out/cache/anim/timings.json");
  const timings: Record<string, number> = fs.existsSync(timingsPath) ? JSON.parse(fs.readFileSync(timingsPath, "utf8")) : {};
  for (const s of todo) {
    const t = Date.now();
    const dir = p(index[s.id].dir);
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        fs.mkdirSync(dir, { recursive: true });
        const inputProps = { shotId: s.id, still: false, anim: true };
        const comp = await selectComposition({ serveUrl, id: `anim-${s.id}`, puppeteerInstance: browser, chromiumOptions, inputProps });
        if (comp.durationInFrames !== index[s.id].times.length) throw new Error(`sample count mismatch ${comp.durationInFrames}`);
        await renderFrames({ serveUrl, composition: comp, outputDir: dir, imageFormat: "jpeg", jpegQuality: style.render.jpegQuality, concurrency: 1, puppeteerInstance: browser, chromiumOptions, inputProps, onStart: () => {}, onFrameUpdate: () => {}, imageSequencePattern: "f[frame].[ext]" });
        fs.writeFileSync(p(index[s.id].dir, "done"), "");
        break;
      } catch (e) { console.error(`${s.id} attempt ${attempt}: ${(e as Error).message}`); if (attempt === 3) throw e; }
    }
    timings[s.id] = Date.now() - t;
    fs.writeFileSync(timingsPath, JSON.stringify(timings, null, 1));
    console.log(s.id, index[s.id].times.length, "samples", timings[s.id], "ms");
  }
  await browser.close({ silent: true }).catch(() => {}); // a closed target on teardown is harmless
}
