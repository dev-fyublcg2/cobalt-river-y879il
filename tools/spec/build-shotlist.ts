// G3: spec/board.txt + spec/script.json -> spec/shotlist.json. Resolves marks, hold-hands spacing and cameras,
// then enforces the G3 gate (count, cut density, max length, required fields, no identical consecutive framings).
import fs from "node:fs";
import * as THREE from "three";
import { p } from "../env";
import { nodeFactories } from "../../assets/sets/common";
import { buildShotScene, getSet, makeCamera, placeChars, solveCamera, type Framing, type Shot } from "../../src/engine/shot";
import { buildAvatar } from "../../assets/avatars/avatar";

const style = JSON.parse(fs.readFileSync(p("spec/style.json"), "utf8"));
const script = JSON.parse(fs.readFileSync(p("spec/script.json"), "utf8"));
const FPS = style.format.fps;
const wordStart = (line: string, w: number) => {
  const l = script.lines.find((x: any) => x.line === line);
  if (!l || !l.tokens[w]) throw new Error(`no word ${line}:${w}`);
  return { t: l.tokens[w].start, text: l.tokens[w].text, beat: l.beat };
};

const rows = fs.readFileSync(p("spec/board.txt"), "utf8").split("\n").filter((r) => r.trim() && !r.startsWith("#"));
const endRow = rows.find((r) => r.startsWith("END"))!;
const [, endAt] = endRow.match(/END\s+(\S+)/)!;
const [endLine, endWord] = endAt.split(":");
const blackStart = wordStart(endLine, +endWord).t;
const filmEnd = script.duration;

const shots: Shot[] = [];
const errors: string[] = [];
rows.filter((r) => !r.startsWith("END")).forEach((row, index) => {
  const cols = row.split("|").map((c) => c.trim());
  const [at, setCol, camCol, charCol, sfx, ...optCols] = cols;
  const [line, word] = at.split(":");
  const [set, mood = "golden"] = setCol.split("/");
  const [framing, subject, az] = camCol.split(/\s+/);
  const opts = Object.fromEntries(optCols.map((o) => { const i = o.indexOf("="); return [o.slice(0, i), o.slice(i + 1)]; }));
  const ws = wordStart(line, +word);
  const raw = charCol ? charCol.split(/\s+/).filter(Boolean).map((c) => {
    const [idMark, pose, face, wrist] = c.split(":");
    const [id, markY] = idMark.split("@");
    const [mark, yawO] = markY.split("/");
    return { id, mark, pose, face, wrist, yawO: yawO !== undefined ? +yawO : undefined };
  }) : [];
  const setB = getSet(set, nodeFactories);
  const rigs = raw.map((c) => buildAvatar(c.id, nodeFactories, () => null, { face: c.face, wrist: c.wrist }));
  const placed = placeChars(setB, raw, rigs);
  const chars = raw.map((c, i) => ({ id: c.id, mark: c.mark, pose: c.pose, face: c.face, wrist: c.wrist ?? rigs[i].spec.wrist, pos: placed[i].pos.map((v) => +v.toFixed(4)) as any, yaw: c.yawO ?? placed[i].yaw, holdAngle: placed[i].holdAngle !== undefined ? +placed[i].holdAngle!.toFixed(3) : undefined, seatTop: placed[i].seatTop }));
  const micro = { breath: true, armSettle: true, headTurn: index % 3 === 0 ? 0 : index % 3 === 1 ? 1 : -1 };
  const ledger = opts.ledger ?? null;
  const built = buildShotScene({ set, mood: mood as any, chars, ledger, micro, dur: 1 }, nodeFactories, () => null);
  const camera = solveCamera(built, chars, framing as Framing, subject, +(az ?? 0));
  shots.push({ id: `S${String(index + 1).padStart(3, "0")}`, index, beat: ws.beat, line, anchor: { line, word: +word, text: ws.text }, t0: index === 0 ? 0 : ws.t, t1: 0, dur: 0, startFrame: 0, frames: 0, set, mood: mood as any, chars, ledger, camera, micro, text: [], sfx, ...(opts.note ? { note: opts.note } : {}) });
});
shots.forEach((s, i) => {
  s.t1 = i + 1 < shots.length ? shots[i + 1].t0 : blackStart;
  s.startFrame = Math.round(s.t0 * FPS);
  s.frames = Math.round(s.t1 * FPS) - s.startFrame;
  s.dur = +(s.frames / FPS).toFixed(4);
});

// Visible world text + caption-safe-zone check (geometric, node-side projection at both zoom extremes)
const safeY = 1 - style.camera.captionSafeBottomFrac;
const zoneHits: string[] = [];
for (const s of shots) {
  const built = buildShotScene({ ...s }, nodeFactories, () => null);
  const vis = new Set<string>();
  for (const z of [s.camera.zoomFrom, s.camera.zoomTo]) {
    const cam = makeCamera(s.camera, z);
    built.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      if (m.userData.worldText !== undefined && m.userData.worldText !== "") {
        const box = new THREE.Box3().setFromObject(m);
        const c = box.getCenter(new THREE.Vector3()).project(cam);
        const ndcY = (1 - c.y) / 2;
        if (c.z < 1 && Math.abs(c.x) < 1 && ndcY > 0 && ndcY < 1) {
          vis.add(m.userData.textId);
          if (ndcY > safeY && z === s.camera.zoomFrom) zoneHits.push(`${s.id} text ${m.userData.textId} at y=${ndcY.toFixed(2)}`);
        }
      }
      if (m.name === "face") {
        const c = m.getWorldPosition(new THREE.Vector3()).project(cam);
        const ndcY = (1 - c.y) / 2;
        if (c.z < 1 && Math.abs(c.x) < 1 && ndcY > safeY && ndcY < 1) zoneHits.push(`${s.id} face at y=${ndcY.toFixed(2)} (zoom ${z})`);
      }
    });
  }
  s.text = [...vis].sort();
}

// ---- G3 gate
const P = style.pacing;
const n = shots.length;
const cuts = n; // n-1 picture cuts + the cut to black
if (Math.abs(n - P.shotsTarget) > P.shotsTolerance) errors.push(`shot count ${n} outside ${P.shotsTarget}+/-${P.shotsTolerance}`);
if (cuts < P.cutsMin || cuts > P.cutsMax) errors.push(`cuts ${cuts} outside ${P.cutsMin}-${P.cutsMax}`);
shots.forEach((s, i) => {
  if (i < n - P.exemptFinalShots && s.dur > P.maxShotS + 1e-9) errors.push(`${s.id} (${s.anchor.line}:${s.anchor.word}) ${s.dur.toFixed(2)} s > ${P.maxShotS}`);
  if (!s.set || !s.camera || !s.sfx) errors.push(`${s.id} missing set/camera/sfx`);
  if (!style.sound.sfxVocabulary.includes(s.sfx)) errors.push(`${s.id} sfx ${s.sfx} not in vocabulary`);
  if (s.chars.some((c) => !c.pose || !c.face)) errors.push(`${s.id} char missing pose/face`);
  if (!style.faces.expressions.every(Boolean) || s.chars.some((c) => !style.faces.expressions.includes(c.face))) errors.push(`${s.id} unknown face`);
  if (Math.abs(s.camera.rollDeg) > 0.01) errors.push(`${s.id} roll ${s.camera.rollDeg}`);
  if (i > 0) {
    const a = shots[i - 1].camera, b = s.camera;
    if (shots[i - 1].set === s.set && a.framing === b.framing && a.subject === b.subject && a.azimuth === b.azimuth) errors.push(`${s.id} identical framing to previous`);
  }
});
const faceStrict = shots.filter((s) => ["ECU", "CU", "MCU"].includes(s.camera.framing) && !s.camera.subject.startsWith("focus")).length;
const faceMS = shots.filter((s) => ["ECU", "CU", "MCU", "MS"].includes(s.camera.framing) && !s.camera.subject.startsWith("focus")).length;
if (faceMS / n < 0.6) errors.push(`face-subject shots ${faceMS}/${n} < 60%`);
const sets = new Set(shots.map((s) => s.set));

const shotlist = {
  $comment: "GENERATED by tools/spec/build-shotlist.ts from spec/board.txt + spec/script.json. Camera fields are fully resolved; a renderer needs only this file + /assets.",
  timing: script.timing, fps: FPS, width: style.format.width, height: style.format.height,
  duration: filmEnd, blackStart: +blackStart.toFixed(3), blackFrames: Math.round(filmEnd * FPS) - Math.round(blackStart * FPS),
  stats: { shots: n, cuts, maxShotS: Math.max(...shots.slice(0, n - P.exemptFinalShots).map((s) => s.dur)), faceSubjectStrict: faceStrict, faceSubjectInclMS: faceMS, sets: [...sets], captionZoneHits: zoneHits },
  shots,
};
fs.writeFileSync(p("spec/shotlist.json"), JSON.stringify(shotlist, null, 1) + "\n");
console.log(JSON.stringify(shotlist.stats, null, 1));
if (errors.length) { console.error("G3 FAIL:\n- " + errors.join("\n- ")); process.exit(1); }
console.log("G3 PASS");
