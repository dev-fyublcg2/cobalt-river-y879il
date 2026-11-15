// G2/G3 invariants re-checked from the committed JSON (so CI catches hand edits that skip the builders).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { tokenize } from "../tools/lib/words";

const style = JSON.parse(fs.readFileSync("spec/style.json", "utf8"));
const script = JSON.parse(fs.readFileSync("spec/script.json", "utf8"));
const sl = JSON.parse(fs.readFileSync("spec/shotlist.json", "utf8"));
const P = style.pacing;

test("G2: 350-400 words, <=14/line, 88 +/- 2 s planned, 4.0-5.0 wps", () => {
  const n = script.lines.reduce((a: number, l: any) => a + tokenize(l.text).length, 0);
  assert.equal(n, script.totalWords);
  assert.ok(n >= P.voWordsMin && n <= P.voWordsMax, `${n} words`);
  for (const l of script.lines) assert.ok(tokenize(l.text).length <= P.maxWordsPerLine, l.line);
  assert.ok(Math.abs(script.duration - 88) <= 2);
  assert.ok(script.overallWps >= P.wpsMin && script.overallWps <= P.wpsMax);
});

test("G3: count, cuts, max length, contiguity, frame-exact, caption zone clear", () => {
  const s = sl.shots;
  assert.ok(Math.abs(s.length - P.shotsTarget) <= P.shotsTolerance);
  assert.ok(sl.stats.cuts >= P.cutsMin && sl.stats.cuts <= P.cutsMax);
  s.forEach((x: any, i: number) => {
    if (i < s.length - P.exemptFinalShots) assert.ok(x.dur <= P.maxShotS + 1e-9, `${x.id} ${x.dur}`);
    if (i > 0) assert.equal(x.startFrame, s[i - 1].startFrame + s[i - 1].frames, `${x.id} not contiguous`);
    assert.ok(style.sound.sfxVocabulary.includes(x.sfx));
    assert.equal(x.camera.rollDeg, 0);
  });
  const last = s[s.length - 1];
  assert.equal(last.startFrame + last.frames + sl.blackFrames, Math.round(sl.duration * sl.fps));
  assert.deepEqual(sl.stats.captionZoneHits, []);
  assert.ok(new Set(s.map((x: any) => x.sfx)).size <= style.sound.maxDistinctSfx + 0);
});

test("G4: every face/set named in the shotlist exists", () => {
  for (const x of sl.shots) {
    for (const c of x.chars) assert.ok(fs.existsSync(`assets/faces/${c.face}.png`), c.face);
    assert.ok(fs.existsSync(`assets/sets/${x.set}.ts`), x.set);
    assert.ok(fs.existsSync(`audio/sfx/${x.sfx}.wav`), x.sfx);
  }
  for (const e of style.faces.expressions) assert.ok(fs.existsSync(`assets/faces/${e}.png`), e);
});
