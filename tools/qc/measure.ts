// G7 measurement pass (S11 tooling). Records MEASURED facts only; it never scores the rubric.
// Usage: tsx tools/qc/measure.ts out/preview-animated-tts-captioned.mp4
import fs from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { p } from "../env";

const file = process.argv[2];
const style = JSON.parse(fs.readFileSync(p("spec/style.json"), "utf8"));
const sl = JSON.parse(fs.readFileSync(p("spec/shotlist.json"), "utf8"));
const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 28 });
const ffErr = (args: string[]) => { const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8", maxBuffer: 1 << 28 }); return r.stderr as string; };

const probe = JSON.parse(run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file]));
const v = probe.streams.find((s: any) => s.codec_type === "video"), a = probe.streams.find((s: any) => s.codec_type === "audio");
const head = fs.readFileSync(file).subarray(0, 1 << 16);
const moovFirst = head.indexOf("moov") >= 0 && (head.indexOf("mdat") < 0 || head.indexOf("moov") < head.indexOf("mdat"));

const ebu = ffErr(["-i", file, "-filter_complex", "ebur128=peak=true", "-f", "null", "-"]);
const I = +(ebu.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop()?.match(/-?[\d.]+/)?.[0] ?? NaN);
const TP = +(ebu.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.pop()?.match(/-?[\d.]+/)?.[0] ?? NaN);

const sc = ffErr(["-i", file, "-vf", "scdet=threshold=8", "-an", "-f", "null", "-"]);
const scTimes = [...sc.matchAll(/lavfi\.scd\.time:\s*([\d.]+)/g)].map((m) => +m[1]);
const cutTimes = [...sl.shots.slice(1).map((s: any) => s.startFrame / sl.fps), sl.blackStart];
const detected = cutTimes.filter((t) => scTimes.some((x) => Math.abs(x - t) < 1.5 / sl.fps)).length;

// "every cut has a sound": peak level in the 120 ms after each planned cut
fs.mkdirSync(p("out/tmp"), { recursive: true });
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", file, "-ac", "1", "-ar", "8000", "-f", "s16le", p("out/tmp/a.raw")]);
const pcm = new Int16Array(fs.readFileSync(p("out/tmp/a.raw")).buffer.slice(0));
const cutPeaks = [0, ...cutTimes].map((t) => { let m = 0; for (let i = Math.floor(t * 8000); i < Math.min(pcm.length, Math.floor((t + 0.12) * 8000)); i++) m = Math.max(m, Math.abs(pcm[i])); return 20 * Math.log10(m / 32768 + 1e-9); });
const silentCuts = cutPeaks.map((d, i) => ({ i, d })).filter((x) => x.d < -45);

// 12 evenly spaced frames + one mid-frame per shot at 400 px wide (animatic legibility sheet)
const frames = Array.from({ length: 12 }, (_, k) => +(((k + 0.5) / 12) * sl.blackStart).toFixed(3));
frames.forEach((t, k) => run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-ss", String(t), "-i", file, "-frames:v", "1", "-vf", "scale=270:-1", p(`out/tmp/f${k}.png`)]));
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...frames.flatMap((_, k) => ["-i", p(`out/tmp/f${k}.png`)]), "-filter_complex", `${frames.map((_, k) => `[${k}]`).join("")}xstack=inputs=12:layout=${Array.from({ length: 12 }, (_, k) => `${(k % 6) * 270}_${Math.floor(k / 6) * 480}`).join("|")}`, p("qc/frames-12.png")]);


// Caption/VO sync, MEASURED on the rendered file: (1) each VO line is located in the final mix by cross-correlating the line
// WAV (8 kHz) against the mix within +/-300 ms of its manifest start; (2) caption highlight times are parsed from the
// burned ASS. Error per word = caption start - (measured line offset + model word time within the line). The word time
// inside a line comes from the TTS model's phoneme durations and is not independently re-measured here.
const vo = JSON.parse(fs.readFileSync(p("spec/vo-manifest.json"), "utf8"));
let sync: any = null;
if (vo.status === "ok" && fs.existsSync(p("out/captions.ass"))) {
  const SR = 8000;
  const toPcm = (f: string) => { run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", f, "-ac", "1", "-ar", String(SR), "-f", "f32le", p("out/tmp/x.f32")]); return new Float32Array(fs.readFileSync(p("out/tmp/x.f32")).buffer.slice(0)); };
  const mix = toPcm(file);
  const lineOffsets = vo.lines.map((l: any) => {
    const x = toPcm(p(l.file));
    const n = Math.min(x.length, SR * 2); // first 2 s of the line is plenty to lock the offset
    const c0 = Math.round(l.start * SR); let best = -Infinity, bestLag = 0;
    for (let lag = -0.3 * SR; lag <= 0.3 * SR; lag++) {
      const o = c0 + lag; if (o < 0 || o + n > mix.length) continue;
      let s = 0, e = 0; for (let i = 0; i < n; i += 2) { s += x[i] * mix[o + i]; e += mix[o + i] * mix[o + i]; }
      const r = s / Math.sqrt(e + 1e-9); if (r > best) { best = r; bestLag = lag; }
    }
    return { line: l.line, manifestStart: l.start, measuredStart: +((c0 + bestLag) / SR).toFixed(4), offsetMs: +((bestLag / SR) * 1000).toFixed(1) };
  });
  const ass = fs.readFileSync(p("out/captions.ass"), "utf8");
  const tsec = (s: string) => { const [h, m, x] = s.split(":"); return +h * 3600 + +m * 60 + +x; };
  const starts = [...ass.matchAll(/^Dialogue: \d+,([\d:.]+),[\d:.]+,Cap,.*\\c&H00D4FF&/gm)].map((m) => tsec(m[1]));
  const errs: number[] = [];
  let k = 0;
  vo.lines.forEach((l: any, li: number) => l.words.forEach((w: any) => {
    const audioT = lineOffsets[li].measuredStart + (w.start - l.start);
    if (k < starts.length) errs.push(Math.abs(starts[k] - audioT) * 1000);
    k++;
  }));
  const sorted = [...errs].sort((a, b) => a - b);
  sync = {
    words: k, captionEvents: starts.length, matched: errs.length,
    maxLineOffsetMs: Math.max(...lineOffsets.map((o: any) => Math.abs(o.offsetMs))),
    captionErrorMs: { median: +sorted[Math.floor(sorted.length / 2)].toFixed(1), p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1), max: +sorted[sorted.length - 1].toFixed(1) },
    within40ms: errs.filter((e) => e <= 40).length, over100ms: errs.filter((e) => e > 100).length,
    lineOffsets,
  };
}
const [num, den] = v.r_frame_rate.split("/").map(Number);
const m = {
  file, measuredAt: "tools/qc/measure.ts", voStatus: vo.status,
  video: { width: v.width, height: v.height, fps: num / den, avgFps: v.avg_frame_rate, codec: v.codec_name, profile: v.profile, pixFmt: v.pix_fmt, frames: +v.nb_frames, faststart: moovFirst },
  durationS: +(+probe.format.duration).toFixed(3),
  audio: a ? { codec: a.codec_name, rate: +a.sample_rate, channels: a.channels, integratedLufs: I, truePeakDbtp: TP } : null,
  cuts: { planned: cutTimes.length, detectedByScdet: detected, scdetEvents: scTimes.length },
  captionSync: sync,
  cutSound: { checked: cutPeaks.length, silentBelowMinus45dBFS: silentCuts.length, quietest: Math.min(...cutPeaks).toFixed(1) },
  checks: {
    resolution: v.width === 1080 && v.height === 1920, fps60: num / den === 60, h264: v.codec_name === "h264", yuv420p: v.pix_fmt === "yuv420p", faststart: moovFirst,
    duration84to92: +probe.format.duration >= 84 && +probe.format.duration <= 92,
    lufsMinus14: Math.abs(I - style.sound.masterLufs) <= style.sound.masterLufsTolerance, truePeak: TP <= style.sound.truePeakDbtp,
    everyCutHasSound: silentCuts.length === 0,
    captionSync40ms: sync ? sync.within40ms === sync.words && sync.matched === sync.words : null,
  },
};
fs.writeFileSync(p("qc/measurements.json"), JSON.stringify(m, null, 1) + "\n");
console.log(JSON.stringify(m, null, 1));
