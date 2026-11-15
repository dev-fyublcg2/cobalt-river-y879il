// G0: bundle the project and render a single frame of the test shot.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { browserExecutable, chromiumOptions, p } from "./env";

const t = Date.now();
const serveUrl = await bundle({ entryPoint: p("src/index.ts"), outDir: p("out/bundle") });
const comp = await selectComposition({ serveUrl, id: "TestShot", browserExecutable, chromiumOptions });
const out = p("out/frames/g0-test-shot.png");
const t1 = Date.now();
await renderStill({ serveUrl, composition: comp, output: out, frame: 30, browserExecutable, chromiumOptions });
console.log(JSON.stringify({ out, bundleMs: t1 - t, stillMs: Date.now() - t1 }));
