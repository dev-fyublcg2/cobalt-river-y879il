// The markdown bible and style.json must agree on every load-bearing number/hex.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const md = fs.readFileSync("spec/style-bible.md", "utf8");
const s = JSON.parse(fs.readFileSync("spec/style.json", "utf8"));
const must = [
  `${s.format.width} x ${s.format.height}`, `${s.format.fps} fps`, `${s.camera.pushFrom} -> ${s.camera.pushTo}`, `${s.camera.vfovDeg} deg`,
  `${s.camera.pitchDeg} deg`, `${s.lighting.keyAzimuthDeg} deg`, `${s.lighting.rimAzimuthDeg} deg`, `intensity ${s.lighting.ambientIntensity}`,
  `strength ${s.lighting.bloomStrength}`, `${s.captions.fontPx} px`, `${s.captions.strokePx} px`, s.captions.active, `${s.captions.popScale} over ${s.captions.popMs} ms`,
  `${s.sound.musicDbfsRms} dBFS`, `${s.sound.musicDuckDb} dB`, `${s.sound.sfxPeakDbfs} dBFS`, `${s.sound.voPeakDbfs} dBFS`, `${s.sound.masterLufs.toFixed(1)} LUFS`,
  ...Object.values(s.palette as Record<string, string>), ...Object.values(s.lighting.moods).flatMap((m: any) => [m.key, m.sky]),
  ...s.faces.expressions,
];
test("style-bible.md mirrors style.json", () => {
  for (const v of must) assert.ok(md.includes(String(v)), `bible missing ${v}`);
});
