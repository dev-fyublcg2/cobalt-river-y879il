// S10: deterministic synthesis of the SFX vocabulary + music bed (fixed seed, pure math), then the stem mix plan.
// No VO is synthesised or faked here: VO comes only from /spec/vo-manifest.json with status "ok".
import fs from "node:fs";
import { p } from "../env";
import { rng } from "../../src/engine/math";

const SR = 48000;
const style = JSON.parse(fs.readFileSync(p("spec/style.json"), "utf8"));
const rand = rng(style.sound.seed);
function wav(path: string, x: Float32Array, peakDb?: number, rmsDb?: number) {
  let peak = 0, sq = 0; for (const v of x) { peak = Math.max(peak, Math.abs(v)); sq += v * v; }
  const rms = Math.sqrt(sq / x.length);
  const g = peakDb !== undefined ? Math.pow(10, peakDb / 20) / (peak || 1) : Math.pow(10, rmsDb! / 20) / (rms || 1);
  const b = Buffer.alloc(44 + x.length * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(x.length * 2, 40);
  x.forEach((v, i) => b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(v * g * 32767))), 44 + i * 2));
  fs.writeFileSync(p(path), b);
}
const buf = (s: number) => new Float32Array(Math.round(s * SR));
const env = (t: number, a: number, d: number) => (t < a ? t / a : Math.exp(-(t - a) / d));
let lp = 0;
const SFX: Record<string, () => Float32Array> = {
  whoosh: () => { const x = buf(0.35); let y = 0; x.forEach((_, i) => { const t = i / SR; const c = 0.04 + 0.5 * Math.sin(Math.PI * t / 0.35); y += c * ((rand() * 2 - 1) - y); x[i] = y * Math.sin(Math.PI * t / 0.35); }); return x; },
  tick: () => { const x = buf(0.06); x.forEach((_, i) => { const t = i / SR; x[i] = Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-t / 0.008); }); return x; },
  pop: () => { const x = buf(0.12); x.forEach((_, i) => { const t = i / SR; const f = 900 - 5000 * t; x[i] = Math.sin(2 * Math.PI * f * t) * env(t, 0.002, 0.03); }); return x; },
  thud: () => { const x = buf(0.4); x.forEach((_, i) => { const t = i / SR; x[i] = Math.sin(2 * Math.PI * (70 - 40 * t) * t) * env(t, 0.004, 0.11) + 0.2 * (rand() * 2 - 1) * Math.exp(-t / 0.01); }); return x; },
  paper: () => { const x = buf(0.3); lp = 0; x.forEach((_, i) => { const t = i / SR; const n = rand() * 2 - 1; lp += 0.6 * (n - lp); x[i] = (n - lp) * (0.4 + 0.6 * Math.abs(Math.sin(2 * Math.PI * 23 * t))) * env(t, 0.02, 0.09); }); return x; },
  bell: () => { const x = buf(1.2); x.forEach((_, i) => { const t = i / SR; x[i] = [1, 2.76, 5.4].reduce((a, h, k) => a + Math.sin(2 * Math.PI * 880 * h * t) * Math.exp(-t / (0.5 / (k + 1))) / (k + 1), 0) * env(t, 0.002, 10); }); return x; },
  roomtone: () => { const x = buf(1.0); let y = 0; x.forEach((_, i) => { y += 0.02 * ((rand() * 2 - 1) - y); x[i] = y; }); return x; },
};
fs.mkdirSync(p("audio/sfx"), { recursive: true }); fs.mkdirSync(p("audio/music"), { recursive: true });
for (const [k, f] of Object.entries(SFX)) wav(`audio/sfx/${k}.wav`, f(), k === "roomtone" ? -40 : style.sound.sfxPeakDbfs);

// music bed: I-vi-IV-V pad + soft pluck at 100 bpm, 88 s, -22 dBFS RMS
const dur = 90, bed = buf(dur), bpm = 100, beat = 60 / bpm;
const chords = [[261.63, 329.63, 392.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]];
bed.forEach((_, i) => {
  const t = i / SR; const bar = Math.floor(t / (beat * 4)); const c = chords[bar % 4];
  let v = c.reduce((a, f) => a + 0.25 * Math.sin(2 * Math.PI * f * t) + 0.08 * Math.sin(2 * Math.PI * 2 * f * t), 0);
  const bt = t % beat; const note = c[Math.floor(t / beat) % 3] * 2;
  v += 0.5 * Math.sin(2 * Math.PI * note * t) * Math.exp(-bt / 0.12);
  bed[i] = v * Math.min(1, t / 1.5);
});
wav("audio/music/bed.wav", bed, undefined, style.sound.musicDbfsRms);
console.log("audio stems written:", Object.keys(SFX).join(", "), "+ music/bed.wav");
