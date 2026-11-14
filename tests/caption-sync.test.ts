// S9: every caption word must start within 40 ms of its VO word timestamp (style bible §9).
// Runs against the real VO manifest when status is "ok"; otherwise it checks the caption engine against the
// planned script timings and SKIPS the real-VO assertion (it is never reported as passed without VO).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { captionEvents, paginate } from "../tools/lib/captions";

const style = JSON.parse(fs.readFileSync("spec/style.json", "utf8"));
const script = JSON.parse(fs.readFileSync("spec/script.json", "utf8"));
const vo = JSON.parse(fs.readFileSync("spec/vo-manifest.json", "utf8"));
const C = style.captions;

function assertSync(words: { text: string; start: number; end: number }[], label: string) {
  const ev = captionEvents(words, C.maxWordsPerLine, 1e9);
  assert.equal(ev.length, words.length, `${label}: one caption event per word`);
  ev.forEach((e, i) => {
    const err = Math.abs(e.start - words[i].start) * 1000;
    assert.ok(err <= C.syncToleranceMs, `${label}: word ${i} '${words[i].text}' off by ${err.toFixed(1)} ms`);
    assert.ok(e.words.length <= C.maxWordsPerLine, `${label}: page ${e.page} has ${e.words.length} words`);
    assert.ok(e.end > e.start, `${label}: event ${i} has non-positive duration`);
  });
}

test("caption engine tracks planned word timings within 40 ms (engine check, not VO sync)", () => {
  assertSync(script.lines.flatMap((l: any) => l.tokens), "planned");
});

test("pages never exceed 3 words / 1 line (<= 2 lines allowed)", () => {
  for (const pg of paginate(script.lines.flatMap((l: any) => l.tokens), C.maxWordsPerLine)) assert.ok(pg.length <= C.maxWordsPerLine * C.maxLines);
});

test("captions match REAL VO word timestamps within 40 ms", { skip: vo.status !== "ok" ? "BLOCKED: vo-manifest status is not ok (no narration supplied)" : false }, () => {
  assertSync(vo.lines.flatMap((l: any) => l.words), "vo");
});
