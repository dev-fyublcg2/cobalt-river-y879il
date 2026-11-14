// S7: zero interpenetration (hands >= 0.15 units outside the torso volume), zero floating, at 12 sampled times per pose,
// including micro-moves. Plus: every shot's hold-hands pair has a hand gap in [0, 0.08].
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "three";
import { buildAvatar } from "../assets/avatars/avatar";
import { applyPose, POSES } from "../assets/avatars/poses";
import { CAST } from "../assets/avatars/cast";
import { nodeFactories } from "../assets/sets/common";

const style = JSON.parse(fs.readFileSync("spec/style.json", "utf8"));
const A = style.avatar;

function handBox(arm: THREE.Group, frame?: THREE.Object3D) {
  // bottom 30% of the arm = the hand volume; optionally expressed in another object's local frame
  const pts: THREE.Vector3[] = [];
  for (const x of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) for (const y of [-A.arm[1], -A.arm[1] * 0.7]) {
    const v = arm.localToWorld(new THREE.Vector3(x, y, z));
    pts.push(frame ? frame.worldToLocal(v) : v);
  }
  return new THREE.Box3().setFromPoints(pts);
}
function torsoBox(r: ReturnType<typeof buildAvatar>) {
  const pts: THREE.Vector3[] = [];
  for (const x of [-1, 1]) for (const z of [-0.5, 0.5]) for (const y of [0, 2]) pts.push(r.torsoPivot.localToWorld(new THREE.Vector3(x, y, z)));
  return new THREE.Box3().setFromPoints(pts);
}

for (const pose of Object.keys(POSES)) {
  test(`pose ${pose}: hands clear of torso by ${A.handClearance}, feet on ground`, () => {
    for (const id of ["milo", "june", "mom"]) {
      const r = buildAvatar(id, nodeFactories, () => null, { face: "neutral", ledger: pose === "holdLedger" ? "rules" : null });
      for (let k = 0; k < 12; k++) {
        const t = (k / 11) * 2.2;
        applyPose(r, pose, t, 2.2, { breath: true, armSettle: true, headTurn: 1 }, { holdAngle: pose === "holdHands" ? -40 : undefined, seatTop: 2 });
        r.root.updateMatrixWorld(true);
        const tb = torsoBox(r).expandByScalar(A.handClearance * CAST[id].scale - 1e-6) // >= clearance passes;
        for (const arm of [r.armL, r.armR]) assert.ok(!handBox(arm).intersectsBox(tb), `${id} ${pose} t=${t.toFixed(2)} hand inside torso+clearance`);
        if (!POSES[pose].sit && !POSES[pose].lie) {
          const b = new THREE.Box3();
          for (const leg of [r.legL, r.legR]) for (const x of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) b.expandByPoint(leg.localToWorld(new THREE.Vector3(x, -A.leg[1], z)));
          assert.ok(Math.abs(b.min.y) < 1e-3, `${id} ${pose} lowest foot at y=${b.min.y.toFixed(4)} (floating/sinking)`);
        }
      }
    }
  });
}

test("hold-hands pairs: hands touch (gap 0..0.08), never overlap", () => {
  const sl = JSON.parse(fs.readFileSync("spec/shotlist.json", "utf8"));
  let n = 0;
  for (const s of sl.shots) {
    const h = s.chars.filter((c: any) => c.pose === "holdHands");
    if (h.length !== 2) continue;
    const tips = h.map((c: any) => {
      const r = buildAvatar(c.id, nodeFactories, () => null, { face: c.face });
      r.root.position.set(...(c.pos as [number, number, number])); r.root.rotation.y = (c.yaw * Math.PI) / 180;
      applyPose(r, "holdHands", 0, 1, { breath: false, armSettle: false, headTurn: 0 }, { holdAngle: c.holdAngle });
      r.root.updateMatrixWorld(true);
      return handBox(r.armL).union(handBox(r.armR));
    });
    const a = tips[0], b = tips[1];
    const gap = Math.max(a.min.x - b.max.x, b.min.x - a.max.x, a.min.z - b.max.z, b.min.z - a.max.z);
    assert.ok(gap >= -1e-3 && gap <= 0.08, `${s.id}: hand gap ${gap.toFixed(3)}`);
    n++;
  }
  assert.ok(n > 0);
});
