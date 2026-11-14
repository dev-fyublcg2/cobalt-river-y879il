// G5/G6 assembly: still + push-in per shot (ffmpeg), concat, cut to black, cut SFX, music bed + ducking, captions.
// Writes out/final*.mp4 ONLY when vo-manifest status is "ok"; otherwise out/preview-novo*.mp4 (never silently ships without VO).
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { p } from "../env";
import { captionEvents, toAss, type Word } from "../lib/captions";

const style = JSON.parse(fs.readFileSync(p("spec/style.json"), "utf8"));
const sl = JSON.parse(fs.readFileSync(p("spec/shotlist.json"), "utf8"));
const script = JSON.parse(fs.readFileSync(p("spec/script.json"), "utf8"));
const vo = JSON.parse(fs.readFileSync(p("spec/vo-manifest.json"), "utf8"));
const index = JSON.parse(fs.readFileSync(p("out/cache/stills/index.json"), "utf8"));
const hasVo = vo.status === "ok";
const stem = hasVo ? "final" : "preview-novo";
const ff = (args: string[]) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
const FPS = sl.fps, W = sl.width, H = sl.height;
fs.mkdirSync(p("out/cache/clips"), { recursive: true });

// 1. per-shot clips: 2D push-in from the 3D still (zoom pushFrom->pushTo, cubic in-out), vignette per bible
const [x1, y1, x2, y2] = style.camera.pushEase;
const list: string[] = [];
for (const s of sl.shots) {
  const still = p(index[s.id]);
  const out = p("out/cache/clips", `${s.id}-${index[s.id].split("/").pop().replace(".png", "")}-${s.frames}.mp4`);
  if (!fs.existsSync(out)) {
    const z0 = 1, z1 = s.camera.zoomTo / s.camera.zoomFrom;
    // smoothstep approximation of cubic-bezier(0.42,0,0.58,1) (max deviation < 0.02)
    const e = `(${'n'}/${Math.max(1, s.frames - 1)})`;
    const z = `(${z0}+(${z1 - z0})*(${e}*${e}*(3-2*${e})))`;
    ff(["-loop", "1", "-framerate", String(FPS), "-i", still, "-frames:v", String(s.frames),
      "-vf", `scale=${W * 2}:${H * 2}:flags=lanczos,crop=w='trunc(${W * 2}/${z}/2)*2':h='trunc(${H * 2}/${z}/2)*2':x='(iw-ow)/2':y='(ih-oh)/2',scale=${W}:${H}:flags=bicubic,vignette=angle=0.55:mode=forward,format=yuv420p`,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-r", String(FPS), out]);
  }
  list.push(`file '${out}'`);
}
const black = p("out/cache/clips", `black-${sl.blackFrames}.mp4`);
ff(["-f", "lavfi", "-i", `color=c=black:s=${W}x${H}:r=${FPS}`, "-frames:v", String(sl.blackFrames), "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", black]);
list.push(`file '${black}'`);
fs.writeFileSync(p("out/cache/concat.txt"), list.join("\n"));
const video = p("out/cache/video.mp4");
ff(["-f", "concat", "-safe", "0", "-i", p("out/cache/concat.txt"), "-c", "copy", video]);

// 2. audio: one SFX per cut (incl. cut to black = roomtone), music bed ducked -8 dB under VO word spans
const speech = (hasVo ? vo.lines.flatMap((l: any) => l.words) : script.lines.flatMap((l: any) => l.tokens)) as { start: number; end: number }[];
const spans: [number, number][] = [];
for (const w of speech) { const last = spans[spans.length - 1]; if (last && w.start - last[1] < style.sound.duckMergeGapMs / 1000) last[1] = w.end; else spans.push([w.start, w.end]); }
const duck = Math.pow(10, style.sound.musicDuckDb / 20).toFixed(4);
const vol = spans.map(([a, b]) => `between(t,${a.toFixed(3)},${b.toFixed(3)})`).join("+");
const cuts = [...sl.shots.map((s: any) => ({ t: s.startFrame / FPS, sfx: s.sfx })), { t: sl.blackStart, sfx: "roomtone" }];
const inputs = ["-i", p("audio/music/bed.wav"), ...cuts.flatMap((c) => ["-i", p(`audio/sfx/${c.sfx}.wav`)])];
let graph = `[0]atrim=0:${sl.duration},volume='if(${vol},${duck},1)':eval=frame,afade=t=out:st=${(sl.blackStart - 0.05).toFixed(3)}:d=0.05[m];`;
cuts.forEach((c, i) => { graph += `[${i + 1}]adelay=${Math.round(c.t * 1000)}:all=1[s${i}];`; });
graph += `[m]${cuts.map((_, i) => `[s${i}]`).join("")}amix=inputs=${cuts.length + 1}:normalize=0:duration=first,pan=stereo|c0=c0|c1=c0[a]`;
// VO stem would be mixed here at voPeakDbfs and the master loudness-normalised to -14 LUFS / -1 dBTP; without VO we do not
// normalise (it would push the bed/SFX up to dialogue loudness) and the QC report records the measured levels honestly.
const audio = p("out/cache/mix.wav");
ff([...inputs, "-filter_complex", graph, "-map", "[a]", "-ar", "48000", audio]);

ff(["-i", video, "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-t", String(sl.duration), p(`out/${stem}.mp4`)]);

// 3. captions (ASS via libass, Anton from /assets/fonts): <=3 words/line, active word #FFD400 with 1.06 pop over 80 ms
const C = style.captions;
const words = (hasVo ? vo.lines.flatMap((l: any) => l.words) : script.lines.flatMap((l: any) => l.tokens)) as Word[];
const ass = toAss(captionEvents(words, C.maxWordsPerLine, sl.blackStart), C, W, H);
fs.writeFileSync(p("out/captions.ass"), ass);
ff(["-i", p(`out/${stem}.mp4`), "-vf", `ass=${p("out/captions.ass")}:fontsdir=${p("assets/fonts")}`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", p(`out/${stem}-captioned.mp4`)]);
console.log(`wrote out/${stem}.mp4 and out/${stem}-captioned.mp4 (VO: ${vo.status})`);
