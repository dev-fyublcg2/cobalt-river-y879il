// G7 measurement pass (S11 tooling). Records MEASURED facts only; it never scores the rubric.
// Usage: tsx tools/qc/measure.ts out/preview-novo-captioned.mp4
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

const vo = JSON.parse(fs.readFileSync(p("spec/vo-manifest.json"), "utf8"));
const [num, den] = v.r_frame_rate.split("/").map(Number);
const m = {
  file, measuredAt: "tools/qc/measure.ts", voStatus: vo.status,
  video: { width: v.width, height: v.height, fps: num / den, avgFps: v.avg_frame_rate, codec: v.codec_name, profile: v.profile, pixFmt: v.pix_fmt, frames: +v.nb_frames, faststart: moovFirst },
  durationS: +(+probe.format.duration).toFixed(3),
  audio: a ? { codec: a.codec_name, rate: +a.sample_rate, channels: a.channels, integratedLufs: I, truePeakDbtp: TP } : null,
  cuts: { planned: cutTimes.length, detectedByScdet: detected, scdetEvents: scTimes.length },
  cutSound: { checked: cutPeaks.length, silentBelowMinus45dBFS: silentCuts.length, quietest: Math.min(...cutPeaks).toFixed(1) },
  checks: {
    resolution: v.width === 1080 && v.height === 1920, fps60: num / den === 60, h264: v.codec_name === "h264", yuv420p: v.pix_fmt === "yuv420p", faststart: moovFirst,
    duration84to92: +probe.format.duration >= 84 && +probe.format.duration <= 92,
    lufsMinus14: Math.abs(I - style.sound.masterLufs) <= style.sound.masterLufsTolerance, truePeak: TP <= style.sound.truePeakDbtp,
    everyCutHasSound: silentCuts.length === 0,
  },
};
fs.writeFileSync(p("qc/measurements.json"), JSON.stringify(m, null, 1) + "\n");
console.log(JSON.stringify(m, null, 1));
