// G5/G6 assembly: per-shot clips (animated 3D samples blended to 60 fps, or the 3D still) + 60 fps push-in, concat, cut to
// black, cut SFX, music bed + ducking, VO mix + loudness master, captions.
// "final*" names are written ONLY with real VO and vo.approvedForMaster === true (set by a person after review, never by tools);
// everything else is a labelled preview (burned-in banner + title metadata) so it cannot be mistaken for the upload master.
import fs from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { p } from "../env";
import { captionEvents, toAss, type Word } from "../lib/captions";

const style = JSON.parse(fs.readFileSync(p("spec/style.json"), "utf8"));
const sl = JSON.parse(fs.readFileSync(p("spec/shotlist.json"), "utf8"));
const script = JSON.parse(fs.readFileSync(p("spec/script.json"), "utf8"));
const vo = JSON.parse(fs.readFileSync(p("spec/vo-manifest.json"), "utf8"));
const index = JSON.parse(fs.readFileSync(p("out/cache/stills/index.json"), "utf8"));
const hasVo = vo.status === "ok";
const approved = hasVo && vo.approvedForMaster === true;
const animIndexPath = p("out/cache/anim/index.json");
const animIndex = fs.existsSync(animIndexPath) ? JSON.parse(fs.readFileSync(animIndexPath, "utf8")) : null;
const animated = !!animIndex && sl.shots.every((s: any) => animIndex[s.id] && fs.existsSync(p(animIndex[s.id].dir, "done")));
if (!animated && !process.argv.includes("--allow-stills")) throw new Error("animated pass incomplete: run tools/render/render-anim.ts (or pass --allow-stills)");
const stem = approved ? "final" : `preview-${animated ? "animated" : "stills"}-${hasVo ? "tts" : "novo"}`;
const LABEL = approved ? "" : hasVo ? (vo.quality === "approved" ? "PREVIEW - NOT SIGNED OFF" : "PREVIEW - OFFLINE TTS VO - NOT FOR UPLOAD") : "PREVIEW - NO VO - NOT FOR UPLOAD";
const ff = (args: string[]) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
const FPS = sl.fps, W = sl.width, H = sl.height;
// Limited-range BT.709 everywhere. The animated samples are full-range JPEGs (decoded as yuvj420p), so the first
// scale converts range + matrix explicitly and every encode tags the stream; QC checks pix_fmt + color_range.
const COLOR = ["-pix_fmt", "yuv420p", "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709"];
fs.mkdirSync(p("out/cache/clips"), { recursive: true });

// 1. per-shot clips. Push-in at 60 fps (zoom pushFrom->pushTo; smoothstep approximation of cubic-bezier(0.42,0,0.58,1),
// max deviation < 0.02), vignette per bible. Animated: samples sit at their own times (last exactly on the shot end) and are
// linearly blended to 60 fps inside the shot only, so every cut stays hard.
const list: string[] = [];
for (const s of sl.shots) {
  const z0 = 1, z1 = s.camera.zoomTo / s.camera.zoomFrom;
  const e = `(n/${Math.max(1, s.frames - 1)})`;
  const z = `(${z0}+(${z1 - z0})*(${e}*${e}*(3-2*${e})))`;
  const push = `scale=${W * 2}:${H * 2}:flags=lanczos:out_color_matrix=bt709:out_range=tv,crop=w='trunc(${W * 2}/${z}/2)*2':h='trunc(${H * 2}/${z}/2)*2':x='(iw-ow)/2':y='(ih-oh)/2',scale=${W}:${H}:flags=bicubic,vignette=angle=0.55:mode=forward,format=yuv420p,setparams=range=tv:colorspace=bt709:color_primaries=bt709:color_trc=bt709`;
  const enc = ["-frames:v", String(s.frames), "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-r", String(FPS), ...COLOR];
  let out: string;
  if (animated) {
    const a = animIndex[s.id];
    out = p("out/cache/clips", `anim-v2-${s.id}-${a.dir.split("/").pop()}-${s.frames}.mp4`);
    if (!fs.existsSync(out)) {
      const ts: number[] = a.times;
      // Remotion zero-pads the sample index once a shot has >= 10 samples: list the files, order by index
      const files = fs.readdirSync(p(a.dir)).filter((f) => f.endsWith(".jpeg")).sort((x, y) => parseInt(x.slice(1)) - parseInt(y.slice(1)));
      if (files.length !== ts.length) throw new Error(`${s.id}: ${files.length} samples on disk, ${ts.length} expected`);
      const fc = ["ffconcat version 1.0"];
      ts.forEach((t, k) => fc.push(`file '${p(a.dir, files[k])}'`, `duration ${((k < ts.length - 1 ? ts[k + 1] : t + 1 / FPS) - t).toFixed(6)}`));
      fc.push(`file '${p(a.dir, files[ts.length - 1])}'`);
      const fcPath = p("out/cache/clips", `anim-${s.id}.ffconcat`);
      fs.writeFileSync(fcPath, fc.join("\n") + "\n");
      ff(["-f", "concat", "-safe", "0", "-i", fcPath, "-vf", `framerate=fps=${FPS}:interp_start=0:interp_end=255:scene=100,tpad=stop_mode=clone:stop=${s.frames},${push}`, ...enc, out]);
    }
  } else {
    out = p("out/cache/clips", `${s.id}-${index[s.id].split("/").pop().replace(".png", "")}-${s.frames}.mp4`);
    if (!fs.existsSync(out)) ff(["-loop", "1", "-framerate", String(FPS), "-i", p(index[s.id]), "-vf", push, ...enc, out]);
  }
  list.push(`file '${out}'`);
}
const black = p("out/cache/clips", `black-${sl.blackFrames}.mp4`);
ff(["-f", "lavfi", "-i", `color=c=black:s=${W}x${H}:r=${FPS}`, "-frames:v", String(sl.blackFrames), "-vf", "format=yuv420p,setparams=range=tv:colorspace=bt709:color_primaries=bt709:color_trc=bt709", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", ...COLOR, black]);
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
// Without VO we do not loudness-normalise (it would push the bed/SFX up to dialogue loudness); QC records measured levels.
const audio = p("out/cache/mix.wav");
if (hasVo) {
  // VO lines peak-normalised to voPeakDbfs and polished, mixed over bed+SFX, then mastered to masterLufs / truePeakDbtp
  const base = cuts.length + 1;
  const VO_CHAIN = "highpass=f=85:poles=2,deesser=i=0.35:m=0.5:f=0.5,acompressor=threshold=-20dB:ratio=2.5:attack=6:release=90:knee=4";
  const voIn = vo.lines.flatMap((l: any) => ["-i", p(l.file)]);
  let g2 = graph.replace("[a]", "[bed]") + ";";
  vo.lines.forEach((l: any, i: number) => {
    const det = spawnSync("ffmpeg", ["-hide_banner", "-i", p(l.file), "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" }).stderr;
    const peak = +(det.match(/max_volume:\s*(-?[\d.]+) dB/)?.[1] ?? 0);
    // VO polish (offline, deterministic): rumble high-pass, de-ess the pitch-shifted sibilants, gentle 2.5:1 levelling
    g2 += `[${base + i}]aresample=48000,volume=${(style.sound.voPeakDbfs - peak).toFixed(2)}dB,${VO_CHAIN},pan=stereo|c0=c0|c1=c0,adelay=${Math.round(l.start * 1000)}:all=1[v${i}];`;
  });
  g2 += `${vo.lines.map((_: any, i: number) => `[v${i}]`).join("")}amix=inputs=${vo.lines.length}:normalize=0[vol];[bed][vol]amix=inputs=2:normalize=0:duration=first[pre]`;
  const pre = p("out/cache/premaster.wav");
  ff([...inputs, ...voIn, "-filter_complex", g2, "-map", "[pre]", "-ar", "48000", pre]);
  // Loudness master: static gain to masterLufs, then a 4x-oversampled peak limiter (true-peak approximation) with
  // 1.0 dB of headroom below truePeakDbtp for the AAC encode. The limiter costs a little loudness, so the gain is
  // re-solved from the measured result (deterministic, converges in 2-3 passes). Final TP/LUFS are measured on the mp4.
  const measure = (f: string, af = "anull") => {
    const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", f, "-af", `${af},ebur128=peak=true`, "-f", "null", "-"], { encoding: "utf8" }).stderr;
    return { I: +(r.match(/I:\s+(-?[\d.]+) LUFS/g)!.pop()!.match(/-?[\d.]+/)![0]), TP: +(r.match(/Peak:\s+(-?[\d.]+) dBFS/g)!.pop()!.match(/-?[\d.]+/)![0]) };
  };
  const ceil = Math.pow(10, (style.sound.truePeakDbtp - 1.0) / 20).toFixed(5);
  const chain = (g: number) => `volume=${g.toFixed(3)}dB,aresample=192000,alimiter=limit=${ceil}:attack=2:release=60:level=false:latency=true,aresample=48000`;
  let gain = style.sound.masterLufs - measure(pre).I;
  for (let k = 0; k < 4; k++) {
    const r = measure(pre, chain(gain));
    console.log(`master pass ${k}: gain ${gain.toFixed(2)} dB -> I ${r.I} LUFS, TP ${r.TP} dBTP`);
    if (Math.abs(r.I - style.sound.masterLufs) <= 0.1) break;
    gain += style.sound.masterLufs - r.I;
  }
  ff(["-i", pre, "-af", chain(gain), "-ar", "48000", audio]);
} else {
  ff([...inputs, "-filter_complex", graph, "-map", "[a]", "-ar", "48000", audio]);
}

ff(["-i", video, "-i", audio, "-map", "0:v", "-map", "1:a", ...(approved ? ["-c:v", "copy"] : ["-vf", `drawtext=fontfile=${p("assets/fonts/Anton-Regular.ttf")}:text='${LABEL}':fontsize=34:fontcolor=white@0.85:box=1:boxcolor=black@0.55:boxborderw=10:x=(w-tw)/2:y=40`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", ...COLOR]), "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-metadata", `title=${approved ? "The Day Counter" : `${LABEL} - The Day Counter`}`, "-t", String(sl.duration), p(`out/${stem}.mp4`)]);

// 3. captions (ASS via libass, Anton from /assets/fonts): <=3 words/line, active word #FFD400 with 1.06 pop over 80 ms
const C = style.captions;
const words = (hasVo ? vo.lines.flatMap((l: any) => l.words) : script.lines.flatMap((l: any) => l.tokens)) as Word[];
const ass = toAss(captionEvents(words, C.maxWordsPerLine, sl.blackStart), C, W, H);
fs.writeFileSync(p("out/captions.ass"), ass);
// the preview banner is already burned into out/<stem>.mp4 and carries through
ff(["-i", p(`out/${stem}.mp4`), "-vf", `ass=${p("out/captions.ass")}:fontsdir=${p("assets/fonts")}`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", ...COLOR, "-c:a", "copy", "-movflags", "+faststart", p(`out/${stem}-captioned.mp4`)]);
console.log(`wrote out/${stem}.mp4 and out/${stem}-captioned.mp4 (VO: ${vo.status})`);
