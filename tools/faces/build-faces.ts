// S5: 14 flat expression sprites, 512x512 transparent PNG, 18 px ink outline, 2-tone fills.
// Deterministic "hand-drawn" wobble from a fixed seed. Rasterised with resvg (no browser, no fonts).
import fs from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { p } from "../env";
import { rng } from "../../src/engine/math";

const INK = "#111111", O = 18;
const r = rng(512);
const j = (v: number, a = 3) => +(v + (r() - 0.5) * a).toFixed(1);

const eye = (cx: number, cy: number, rx = 34, ry = 46, pupil = 0.5, look = 0) => `
  <ellipse cx="${j(cx)}" cy="${j(cy)}" rx="${rx}" ry="${ry}" fill="#FFFFFF" stroke="${INK}" stroke-width="${O}"/>
  <ellipse cx="${cx - 6}" cy="${cy + ry * 0.35}" rx="${rx * 0.7}" ry="${ry * 0.4}" fill="#DDE3EA"/>
  <ellipse cx="${cx + look}" cy="${cy + 4}" rx="${rx * pupil}" ry="${ry * pupil}" fill="${INK}"/>
  <circle cx="${cx + look + 8}" cy="${cy - 10}" r="7" fill="#FFFFFF"/>`;
const closed = (cx: number, cy: number, up = true) => `<path d="M${cx - 38} ${cy} Q${cx} ${up ? cy - 30 : cy + 30} ${cx + 38} ${cy}" fill="none" stroke="${INK}" stroke-width="${O}" stroke-linecap="round"/>`;
const flatEye = (cx: number, cy: number) => `<path d="M${cx - 38} ${cy} L${cx + 38} ${j(cy)}" stroke="${INK}" stroke-width="${O}" stroke-linecap="round"/>
  <path d="M${cx - 34} ${cy + 4} Q${cx} ${cy + 40} ${cx + 34} ${cy + 4} Z" fill="#FFFFFF" stroke="${INK}" stroke-width="${O * 0.8}" stroke-linejoin="round"/><circle cx="${cx}" cy="${cy + 16}" r="11" fill="${INK}"/>`;
const brow = (x1: number, y1: number, x2: number, y2: number) => `<path d="M${x1} ${y1} L${j(x2)} ${j(y2)}" stroke="${INK}" stroke-width="${O + 4}" stroke-linecap="round"/>`;
const mouthOpen = (d: string, tongue = true) => `<path d="${d}" fill="#7A1F2B" stroke="${INK}" stroke-width="${O}" stroke-linejoin="round"/>${tongue ? `<clipPath id="m"><path d="${d}"/></clipPath><ellipse cx="256" cy="420" rx="54" ry="34" fill="#E8648C" clip-path="url(#m)"/>` : ""}`;
const line = (d: string) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${O}" stroke-linecap="round" stroke-linejoin="round"/>`;
const blush = `<ellipse cx="120" cy="330" rx="36" ry="20" fill="#FF8FB1" opacity="0.55"/><ellipse cx="392" cy="330" rx="36" ry="20" fill="#FF8FB1" opacity="0.55"/>`;
const tear = (x: number, y: number) => `<path d="M${x} ${y} Q${x - 22} ${y + 50} ${x} ${y + 64} Q${x + 22} ${y + 50} ${x} ${y} Z" fill="#7EC8F0" stroke="${INK}" stroke-width="10"/><path d="M${x - 4} ${y + 30} Q${x - 10} ${y + 46} ${x - 2} ${y + 54}" stroke="#FFFFFF" stroke-width="6" fill="none"/>`;
const sweat = `<path d="M430 140 Q410 185 430 200 Q450 185 430 140 Z" fill="#BFE3F5" stroke="${INK}" stroke-width="10"/>`;

const L = 176, R = 336, EY = 220;
const FACES: Record<string, string> = {
  neutral:    eye(L, EY) + eye(R, EY) + brow(140, 140, 210, 136) + brow(302, 136, 372, 140) + line("M206 380 L306 380"),
  blink:      closed(L, EY, false) + closed(R, EY, false) + brow(140, 146, 210, 142) + brow(302, 142, 372, 146) + line("M206 380 L306 380"),
  happy:      closed(L, EY + 10) + closed(R, EY + 10) + blush + mouthOpen("M176 356 Q256 470 336 356 Z"),
  laugh:      closed(L, EY) + closed(R, EY) + blush + brow(140, 128, 206, 118) + brow(306, 118, 372, 128) + mouthOpen("M150 336 Q256 500 362 336 Z"),
  worried:    eye(L, EY, 32, 44, 0.42) + eye(R, EY, 32, 44, 0.42) + brow(140, 150, 206, 122) + brow(306, 122, 372, 150) + line("M196 396 Q226 374 256 392 Q286 410 316 388") + sweat,
  scared:     eye(L, EY, 40, 54, 0.3) + eye(R, EY, 40, 54, 0.3) + brow(140, 132, 206, 108) + brow(306, 108, 372, 132) + mouthOpen("M206 376 Q256 350 306 376 L306 420 Q256 440 206 420 Z", false) + sweat,
  sad:        eye(L, EY + 8, 30, 38, 0.5) + eye(R, EY + 8, 30, 38, 0.5) + brow(140, 168, 206, 140) + brow(306, 140, 372, 168) + line("M196 410 Q256 360 316 410"),
  crying:     closed(L, EY + 6, false) + closed(R, EY + 6, false) + brow(140, 170, 206, 140) + brow(306, 140, 372, 170) + tear(150, 252) + tear(362, 252) + mouthOpen("M196 420 Q256 340 316 420 Z", false),
  determined: eye(L, EY + 6, 34, 36, 0.55) + eye(R, EY + 6, 34, 36, 0.55) + brow(132, 160, 214, 188) + brow(298, 188, 380, 160) + line("M200 392 L312 382"),
  surprised:  eye(L, EY - 6, 40, 54, 0.38) + eye(R, EY - 6, 40, 54, 0.38) + brow(140, 116, 206, 100) + brow(306, 100, 372, 116) + `<ellipse cx="256" cy="402" rx="34" ry="42" fill="#7A1F2B" stroke="${INK}" stroke-width="${O}"/>`,
  smug:       flatEye(L, EY) + flatEye(R, EY) + brow(140, 150, 206, 150) + brow(306, 128, 372, 120) + line("M196 388 Q270 410 322 360"),
  confused:   eye(L, EY, 30, 40, 0.5, 8) + eye(R, EY - 10, 38, 50, 0.45, 8) + brow(140, 156, 206, 150) + brow(302, 112, 372, 130) + line("M200 394 Q228 378 256 394 Q284 410 312 392"),
  angry:      eye(L, EY + 10, 34, 34, 0.6) + eye(R, EY + 10, 34, 34, 0.6) + brow(130, 150, 218, 190) + brow(294, 190, 382, 150) + mouthOpen("M196 414 Q256 366 316 414 Z", false),
  deadpan:    `<path d="M${L - 38} ${EY} L${L + 38} ${EY}" stroke="${INK}" stroke-width="${O}" stroke-linecap="round"/><path d="M${L - 34} ${EY + 4} L${L + 34} ${EY + 4} Q${L} ${EY + 42} ${L - 34} ${EY + 4}Z" fill="#FFFFFF" stroke="${INK}" stroke-width="${O * 0.8}"/><circle cx="${L}" cy="${EY + 16}" r="11" fill="${INK}"/>` +
              `<path d="M${R - 38} ${EY} L${R + 38} ${EY}" stroke="${INK}" stroke-width="${O}" stroke-linecap="round"/><path d="M${R - 34} ${EY + 4} L${R + 34} ${EY + 4} Q${R} ${EY + 42} ${R - 34} ${EY + 4}Z" fill="#FFFFFF" stroke="${INK}" stroke-width="${O * 0.8}"/><circle cx="${R}" cy="${EY + 16}" r="11" fill="${INK}"/>` + line("M206 386 L306 386"),
};

const style = JSON.parse(fs.readFileSync(p("spec/style.json"), "utf8"));
const missing = style.faces.expressions.filter((e: string) => !FACES[e]);
if (missing.length) throw new Error("missing faces: " + missing);
fs.mkdirSync(p("assets/faces"), { recursive: true });
for (const e of style.faces.expressions) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${FACES[e]}</svg>`;
  fs.writeFileSync(p(`assets/faces/${e}.png`), new Resvg(svg, { fitTo: { mode: "width", value: 512 } }).render().asPng());
}
console.log(`wrote ${style.faces.expressions.length} faces`);
