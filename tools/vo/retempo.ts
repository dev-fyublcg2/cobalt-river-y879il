// S8 step 2: time-compress synthesized lines (pitch-preserving rubberband) so the overall pace hits the bible's
// planning pace (4.6 wps target window 4.0-5.0). Word timestamps are scaled by the same factor. Idempotent via a .orig copy.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { p } from "../env";

const style = JSON.parse(fs.readFileSync(p("spec/style.json"), "utf8"));
const script = JSON.parse(fs.readFileSync(p("spec/script.json"), "utf8"));
const target = +(process.argv[2] ?? 4.4); // words per second of speech (excluding planned pauses)
const dur = (f: string) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" });
let speech = 0, words = 0;
for (const l of script.lines) {
  const orig = p(`audio/vo/${l.line}.orig.wav`), cur = p(`audio/vo/${l.line}.wav`);
  if (!fs.existsSync(orig)) { fs.copyFileSync(cur, orig); fs.copyFileSync(p(`audio/vo/${l.line}.words.json`), p(`audio/vo/${l.line}.orig.words.json`)); }
  speech += dur(orig); words += l.words;
}
const tempo = speech / (words / target);
for (const l of script.lines) {
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", p(`audio/vo/${l.line}.orig.wav`), "-af", `rubberband=tempo=${tempo.toFixed(4)}:formant=preserved,aresample=48000`, "-ac", "1", p(`audio/vo/${l.line}.wav`)]);
  const w = JSON.parse(fs.readFileSync(p(`audio/vo/${l.line}.orig.words.json`), "utf8"));
  fs.writeFileSync(p(`audio/vo/${l.line}.words.json`), JSON.stringify(w.map((x: any) => ({ ...x, start: +(x.start / tempo).toFixed(3), end: +(x.end / tempo).toFixed(3) })), null, 1));
}
console.log(JSON.stringify({ originalSpeechS: +speech.toFixed(2), tempo: +tempo.toFixed(4), effectiveSpeedVsPiperDefault: +(style.voice.speed * tempo).toFixed(3), targetWps: target }));
