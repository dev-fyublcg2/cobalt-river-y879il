// Animated shot pass: every frame rendered in 3D (breath bob, arm settle/sway, head turn, camera push-in via lens zoom).
// Efficiency trade-off (logged): 540x960 @ 30 fps in 3D, upscaled to 1080x1920 and frame-doubled to the 60 fps master.
// Cached per shot by sha256(shot JSON + sources). A failed shot re-renders alone (3 attempts). Usage: render-anim.ts [S001 ...]
import fs from "node:fs";
import crypto from "node:crypto";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import { browserExecutable, chromiumOptions, p } from "../env";

const sl = JSON.parse(fs.readFileSync(p("spec/shotlist.json"), "utf8"));
const only = process.argv.slice(2);
const h = crypto.createHash("sha256");
for (const dir of ["assets/sets", "assets/avatars", "src/engine", "src/scenes", "assets/faces"]) for (const f of fs.readdirSync(p(dir)).sort()) h.update(fs.readFileSync(p(dir, f)));
h.update(fs.readFileSync(p("spec/style.json")));
const base = h.digest("hex");
const keyOf = (s: any) => crypto.createHash("sha256").update("anim" + base + JSON.stringify(s)).digest("hex").slice(0, 16);
fs.mkdirSync(p("out/cache/anim"), { recursive: true });
const index: Record<string, string> = {};
for (const s of sl.shots) index[s.id] = `out/cache/anim/${keyOf(s)}.mp4`;
fs.writeFileSync(p("out/cache/anim/index.json"), JSON.stringify(index, null, 1));
const todo = sl.shots.filter((s: any) => (!only.length || only.includes(s.id)) && !fs.existsSync(p(index[s.id])));
console.log(`${todo.length} animated shots to render`);
if (todo.length) {
  fs.rmSync(p("out/bundle"), { recursive: true, force: true });
  const serveUrl = await bundle({ entryPoint: p("src/index.ts"), outDir: p("out/bundle"), publicDir: p("out/public") });
  const browser = await openBrowser("chrome", { browserExecutable, chromiumOptions });
  for (const s of todo) {
    const t = Date.now();
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const comp = await selectComposition({ serveUrl, id: `anim-${s.id}`, puppeteerInstance: browser, chromiumOptions, inputProps: { shotId: s.id, still: false } });
        await renderMedia({ serveUrl, composition: comp, codec: "h264", crf: 16, muted: true, imageFormat: "jpeg", jpegQuality: 92, concurrency: 1, outputLocation: p(index[s.id]) + ".tmp.mp4", puppeteerInstance: browser, chromiumOptions, inputProps: { shotId: s.id, still: false } });
        fs.renameSync(p(index[s.id]) + ".tmp.mp4", p(index[s.id]));
        break;
      } catch (e) { console.error(`${s.id} attempt ${attempt}: ${(e as Error).message}`); if (attempt === 3) throw e; }
    }
    console.log(s.id, comp_frames(s), "frames", Date.now() - t, "ms");
  }
  await browser.close({ silent: true });
}
function comp_frames(s: any) { return Math.ceil(s.frames / 2); }
