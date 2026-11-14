// S8 ingestion path for approved narration (recorded or from an approved TTS export). Never generates audio.
// Input: audio/vo/<LINE>.wav for every script line + audio/vo/<LINE>.words.json = [{ "text": "...", "start": s, "end": s }]
// (times relative to the WAV start; from TTS word timestamps or forced alignment). Output: spec/vo-manifest.json status "ok".
// Lines are laid end-to-end with the bible's planned pauses; word texts must match script tokens 1:1.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { p } from "../env";
import { normalizeWord, tokenize } from "../lib/words";

const style = JSON.parse(fs.readFileSync(p("spec/style.json"), "utf8"));
const script = JSON.parse(fs.readFileSync(p("spec/script.json"), "utf8"));
const problems: string[] = [];
let t = 0;
const lines = script.lines.map((l: any, i: number) => {
  const wav = p(`audio/vo/${l.line}.wav`), wj = p(`audio/vo/${l.line}.words.json`);
  if (!fs.existsSync(wav) || !fs.existsSync(wj)) { problems.push(`missing ${l.line}.wav or ${l.line}.words.json`); return null; }
  const dur = +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav], { encoding: "utf8" });
  const words = JSON.parse(fs.readFileSync(wj, "utf8"));
  const toks = tokenize(l.text);
  if (words.length !== toks.length) problems.push(`${l.line}: ${words.length} timed words vs ${toks.length} script words`);
  toks.forEach((tk, k) => { if (words[k] && normalizeWord(words[k].text) !== tk.clean) problems.push(`${l.line} word ${k}: '${words[k].text}' != '${tk.text}'`); });
  if (i > 0) t += script.lines[i - 1].beat !== l.beat ? style.pacing.beatPauseS : style.pacing.linePauseS;
  const start = t; t += dur;
  return { line: l.line, file: `audio/vo/${l.line}.wav`, start: +start.toFixed(3), duration: +dur.toFixed(3), words: words.map((w: any, k: number) => ({ text: toks[k]?.text ?? w.text, start: +(start + w.start).toFixed(3), end: +(start + w.end).toFixed(3) })) };
});
if (problems.length) { console.error("VO import FAILED (manifest unchanged):\n- " + problems.join("\n- ")); process.exit(1); }
const words = lines.flatMap((l: any) => l.words);
const wps = words.length / t;
fs.writeFileSync(p("spec/vo-manifest.json"), JSON.stringify({ status: "ok", source: process.argv[2] ?? "recorded", quality: process.argv[3] ?? "unreviewed", totalWords: words.length, speechEnd: +t.toFixed(3), wps: +wps.toFixed(3), lines }, null, 1) + "\n");
console.log(`vo-manifest ok: ${words.length} words, ${t.toFixed(2)} s, ${wps.toFixed(2)} wps${wps < style.pacing.wpsMin || wps > style.pacing.wpsMax ? "  WARNING: outside 4.0-5.0 wps" : ""}`);
console.log("next: retime script/shotlist from the manifest, then pnpm stills && pnpm assemble");
