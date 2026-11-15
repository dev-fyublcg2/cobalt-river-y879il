// Pose library + micro-moves. Held poses only; every value is degrees. Time comes from the frame, nothing else.
// Sign conventions (character faces +z): arm/leg x < 0 swings forward; spread > 0 swings outward.
import * as THREE from "three";
import styleJson from "../../spec/style.json";
import { cubicBezier, DEG } from "../../src/engine/math";
import { ARM_X, HIP_Y, type Rig } from "./avatar";

const A = styleJson.avatar;
export type Limb = { x: number; spread: number };
export type Pose = {
  armL: Limb; armR: Limb; legL: Limb; legR: Limb;
  head: { pitch: number; yaw: number; roll?: number };
  torso?: { pitch: number };
  sit?: boolean; lie?: boolean; ledger?: boolean;
};

const L = (x: number, spread = 0): Limb => ({ x, spread });

export const POSES: Record<string, Pose> = {
  stand:      { armL: L(0, 3), armR: L(0, 3), legL: L(0), legR: L(0), head: { pitch: 0, yaw: 0 } },
  checkWrist: { armL: L(-55, 0), armR: L(2, 3), legL: L(0), legR: L(0), head: { pitch: -18, yaw: 12 } },
  showWrist:  { armL: L(-72, 0), armR: L(0, 4), legL: L(0), legR: L(0), head: { pitch: -4, yaw: 0 } },
  holdHands:  { armL: L(-40, 2), armR: L(-40, 2), legL: L(0), legR: L(0), head: { pitch: -6, yaw: 0 } },
  point:      { armL: L(0, 4), armR: L(-86, 0), legL: L(0), legR: L(0), head: { pitch: 0, yaw: -6 } },
  armsUp:     { armL: L(-10, 148), armR: L(-10, 148), legL: L(0, 4), legR: L(0, 4), head: { pitch: 6, yaw: 0 } },
  shrug:      { armL: L(-28, 26), armR: L(-28, 26), legL: L(0), legR: L(0), head: { pitch: 0, yaw: 0, roll: 7 } },
  walk:       { armL: L(18, 3), armR: L(-18, 3), legL: L(-22), legR: L(22), head: { pitch: 0, yaw: 0 } },
  run:        { armL: L(34, 4), armR: L(-34, 4), legL: L(-36), legR: L(34), head: { pitch: 4, yaw: 0 }, torso: { pitch: -7 } },
  sit:        { armL: L(-24, 2), armR: L(-24, 2), legL: L(-90), legR: L(-90), head: { pitch: 0, yaw: 0 }, sit: true },
  sitSlump:   { armL: L(-14, 2), armR: L(-14, 2), legL: L(-90), legR: L(-90), head: { pitch: -16, yaw: 0 }, torso: { pitch: -5 }, sit: true },
  slump:      { armL: L(-4, 2), armR: L(-4, 2), legL: L(0), legR: L(0), head: { pitch: -15, yaw: 0 }, torso: { pitch: -4 } },
  holdLedger: { armL: L(-68, 0), armR: L(-68, 0), legL: L(0), legR: L(0), head: { pitch: -14, yaw: 0 }, ledger: true },
  wave:       { armL: L(0, 3), armR: L(-6, 150), legL: L(0), legR: L(0), head: { pitch: 2, yaw: 0 } },
  lieAwake:   { armL: L(0, 6), armR: L(0, 6), legL: L(0), legR: L(0), head: { pitch: 0, yaw: 0 }, lie: true },
};

export type MicroMoves = { breath: boolean; armSettle: boolean; headTurn: number /* -1, 0, 1; 0 = gentle look-around */ };
const ease = cubicBezier(0.42, 0, 0.58, 1);

function setLimb(pivot: THREE.Group, l: Limb, side: 1 | -1) {
  pivot.rotation.set(l.x * DEG, 0, side * l.spread * DEG, "XYZ");
}

/**
 * Apply a held pose at local shot time t (s) of a shot lasting dur (s).
 * Ground contact is solved from the base pose (not the micro-moves), so feet never slide or float.
 */
export function applyPose(rig: Rig, poseName: string, t: number, dur: number, mm: MicroMoves, extra: { holdAngle?: number; seatTop?: number; holdArm?: "L" | "R"; phase?: number } = {}) {
  const pose = POSES[poseName];
  if (!pose) throw new Error(`unknown pose ${poseName}`);
  const settle = mm.armSettle ? A.armSettleDeg * (1 - ease(Math.min(1, t / A.armSettleS))) : 0;
  const hold = poseName === "holdHands" && extra.holdAngle !== undefined ? extra.holdAngle : undefined;
  const ph = extra.phase ?? 0;
  const stride = poseName === "walk" || poseName === "run";
  const swing = stride ? A.armSwingDeg * Math.sin((2 * Math.PI * t) / A.armSwingPeriodS + ph) : 0;
  // hold hands with the camera-side hand only; the far arm rests (keeps the clasp readable, no arm tangle)
  const holdL = hold !== undefined && extra.holdArm !== "R";
  const holdR = hold !== undefined && extra.holdArm !== "L";
  const armL = hold !== undefined && !holdL ? { x: 0, spread: 3 + settle } : { x: (holdL ? hold! : pose.armL.x) - settle * 0.5 + swing, spread: pose.armL.spread + settle };
  const armR = hold !== undefined && !holdR ? { x: 0, spread: 3 + settle } : { x: (holdR ? hold! : pose.armR.x) - settle * 0.5 - swing, spread: pose.armR.spread + settle };
  // armL sits on +x (character's left when facing +z): outward is +z rotation; armR on -x: outward is -z
  setLimb(rig.armL, armL, 1);
  setLimb(rig.armR, armR, -1);
  setLimb(rig.legL, pose.legL, 1);
  setLimb(rig.legR, pose.legR, -1);

  const turn = mm.headTurn !== 0 ? mm.headTurn * A.headTurnDeg * ease(Math.min(1, t / Math.max(dur, 0.001))) : 0.5 * A.headTurnDeg * Math.sin((2 * Math.PI * t) / 2.2 + ph);
  rig.headPivot.rotation.set(-pose.head.pitch * DEG, (pose.head.yaw + turn) * DEG, (pose.head.roll ?? 0) * DEG, "YXZ");
  const sway = mm.breath && !pose.lie ? A.swayDeg * Math.sin((2 * Math.PI * t) / A.swayPeriodS + ph) : 0;
  rig.torsoPivot.rotation.set(-(pose.torso?.pitch ?? 0) * DEG, 0, sway * DEG);
  const bob = mm.breath ? A.breathBobAmp * Math.sin((2 * Math.PI * t) / A.breathPeriodS) : 0;
  rig.torsoPivot.position.y = HIP_Y + bob;
  if (rig.ledger) {
    const a = (pose.ledger ? pose.armL.x - settle * 0.5 : -50) * DEG;
    const reach = A.arm[1] * 0.86;
    rig.ledger.position.set(0, A.torso[1] - reach * Math.cos(a) + 0.12, A.arm[2] * 0 + -reach * Math.sin(a));
    rig.ledger.rotation.set(0.62, 0, 0);
    rig.ledger.visible = !!pose.ledger;
  }

  // ground contact from the base pose
  const s = rig.spec.scale;
  if (pose.lie) {
    rig.body.rotation.set(-Math.PI / 2, 0, 0);
    rig.body.position.set(0, (extra.seatTop ?? 0) + (A.torso[2] / 2) * s, (A.leg[1] + A.torso[1]) * s * 0.5);
  } else if (pose.sit) {
    rig.body.rotation.set(0, 0, 0);
    const seat = extra.seatTop ?? 1.5;
    rig.body.position.set(0, seat - (HIP_Y - A.leg[0] / 2) * s, -0.2 * s);
  } else {
    rig.body.rotation.set(0, 0, 0);
    // ground contact solved numerically from the posed leg corners (handles swing and spread), base pose only
    rig.body.position.set(0, 0, 0);
    rig.body.updateMatrixWorld(true);
    let minY = Infinity;
    const inv = new THREE.Matrix4().copy(rig.body.matrixWorld).invert();
    for (const leg of [rig.legL, rig.legR])
      for (const x of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) {
        const v = leg.localToWorld(new THREE.Vector3(x, -A.leg[1], z)).applyMatrix4(inv);
        minY = Math.min(minY, v.y);
      }
    rig.body.position.set(0, -minY * s, 0);
  }
}

/** World-space reach of the hold-hands pose: horizontal distance from torso centre to hand tip and hand height. */
export function handReach(rig: Rig, angleDeg: number) {
  const s = rig.spec.scale;
  const a = Math.abs(angleDeg) * DEG;
  const forward = (A.arm[1] * Math.sin(a) + (A.arm[2] / 2) * Math.cos(a)) * s;
  const height = (HIP_Y + A.torso[1] - A.arm[1] * Math.cos(a)) * s;
  return { forward, height, lateral: ARM_X * s };
}
