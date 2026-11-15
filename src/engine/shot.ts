// Shot assembly + camera solver. Node-safe (no DOM): the browser passes real Factories/face textures,
// the spec tools pass plain-colour factories to resolve cameras and run geometric QC.
import * as THREE from "three";
import styleJson from "../../spec/style.json";
import { SETS } from "../../assets/sets";
import type { Factories, Mark, SetBuild, Vec3 } from "../../assets/sets/common";
import { buildAvatar, type FaceLoader, type Rig } from "../../assets/avatars/avatar";
import { applyPose, handReach, POSES, type MicroMoves } from "../../assets/avatars/poses";
import { DEG } from "./math";

const S = styleJson;

export type Framing = "ECU" | "CU" | "MCU" | "MS" | "WS" | "EWS" | "INS";
export type ShotChar = {
  id: string; mark: string; pose: string; face: string; wrist?: string;
  pos: Vec3; yaw: number; holdAngle?: number; seatTop?: number; holdArm?: "L" | "R";
};
export type ShotCamera = {
  framing: Framing; subject: string; azimuth: number;
  position: Vec3; quaternion: [number, number, number, number];
  pitchDeg: number; rollDeg: number; vfovDeg: number; zoomFrom: number; zoomTo: number; focusDistance: number;
  subjectPoint: Vec3; clamped: boolean;
};
export type Shot = {
  id: string; index: number; beat: number; line: string;
  anchor: { line: string; word: number; text: string };
  t0: number; t1: number; dur: number; startFrame: number; frames: number;
  set: string; mood: "golden" | "dawn";
  chars: ShotChar[];
  ledger: string | null;
  camera: ShotCamera;
  micro: MicroMoves;
  text: string[];
  sfx: string;
  note?: string;
};

const setCache = new Map<string, SetBuild>();
export function getSet(id: string, f: Factories, cacheKey = "node"): SetBuild {
  const key = `${cacheKey}:${id}`;
  let s = setCache.get(key);
  if (!s) {
    if (!SETS[id]) throw new Error(`unknown set ${id}`);
    s = SETS[id].build(f);
    setCache.set(key, s);
  }
  return s;
}

/** Resolve a mark to a world placement; pairs holding hands are solved so the hands just touch (0.03 gap). */
export function placeChars(set: SetBuild, chars: { id: string; mark: string; pose: string }[], rigs: Rig[]): { pos: Vec3; yaw: number; holdAngle?: number; seatTop?: number; holdArm?: "L" | "R" }[] {
  const out = chars.map((c) => {
    const m: Mark | undefined = set.marks[c.mark];
    if (!m) throw new Error(`set has no mark ${c.mark}`);
    return { pos: [...m.pos] as Vec3, yaw: m.yaw, seatTop: m.seatTop } as { pos: Vec3; yaw: number; holdAngle?: number; seatTop?: number };
  });
  const holders = chars.map((c, i) => (c.pose === "holdHands" ? i : -1)).filter((i) => i >= 0);
  if (holders.length === 2) {
    const [a, b] = holders;
    const ra = rigs[a], rb = rigs[b];
    const A = S.avatar;
    const shoulder = (r: Rig) => (A.leg[1] + A.torso[1]) * r.spec.scale;
    const armLen = (r: Rig) => A.arm[1] * r.spec.scale;
    const meet = Math.min(shoulder(ra) - 0.62 * armLen(ra), shoulder(rb) - 0.62 * armLen(rb));
    const ang = (r: Rig) => -Math.acos(Math.min(1, Math.max(-1, (shoulder(r) - meet) / armLen(r)))) / DEG;
    const angA = ang(ra), angB = ang(rb);
    const sep = handReach(ra, angA).forward + handReach(rb, angB).forward + 0.03;
    const pa = new THREE.Vector3(...out[a].pos), pb = new THREE.Vector3(...out[b].pos);
    const mid = pa.clone().add(pb).multiplyScalar(0.5);
    const dir = pb.clone().sub(pa).setY(0).normalize();
    const yawA = Math.atan2(dir.x, dir.z) / DEG;
    // camera-side hand: armL sits on local +x; world +x of a character facing yaw is (cos yaw, 0, -sin yaw)
    const side = (yawDeg: number): "L" | "R" => (-Math.sin(yawDeg * DEG) >= 0 ? "L" : "R");
    // each linked hand sits off the body axis by its rig's lateral reach; shift B sideways so the two hands line up
    const lat = (r: Rig) => handReach(r, angA).lateral;
    const perp = new THREE.Vector3(-dir.z, 0, dir.x);
    const pA = mid.clone().addScaledVector(dir, -sep / 2);
    const pB = mid.clone().addScaledVector(dir, sep / 2).addScaledVector(perp, Math.sign(perp.z || 1) * (lat(ra) - lat(rb)));
    out[a] = { ...out[a], pos: pA.toArray() as Vec3, yaw: yawA, holdAngle: angA, holdArm: side(yawA) } as any;
    out[b] = { ...out[b], pos: pB.toArray() as Vec3, yaw: yawA + 180, holdAngle: angB, holdArm: side(yawA + 180) } as any;
  }
  return out;
}

export type BuiltShot = { scene: THREE.Scene; set: SetBuild; rigs: Rig[]; lights: THREE.Group; update: (t: number) => void };

export function moodColors(mood: "golden" | "dawn") {
  return S.lighting.moods[mood];
}

/** Assemble scene graph for a shot (set + posed rigs + 3-point light rig). */
export function buildShotScene(shot: Pick<Shot, "set" | "mood" | "chars" | "ledger" | "micro" | "dur"> & { camera?: Pick<ShotCamera, "position" | "subjectPoint" | "framing"> }, f: Factories, face: FaceLoader, cacheKey = "node"): BuiltShot {
  const scene = new THREE.Scene();
  const set = getSet(shot.set, f, cacheKey);
  scene.add(set.group);
  const rigs = shot.chars.map((c) => buildAvatar(c.id, f, face, { face: c.face, wrist: c.wrist, ledger: c.pose === "holdLedger" ? shot.ledger ?? "rules" : null }));
  rigs.forEach((r, i) => {
    const c = shot.chars[i];
    r.root.position.set(...c.pos);
    r.root.rotation.y = c.yaw * DEG;
    scene.add(r.root);
  });
  const lights = new THREE.Group();
  scene.add(lights);
  const m = moodColors(shot.mood);
  const L = S.lighting;
  const hemi = new THREE.HemisphereLight(m.sky, m.ground, L.ambientIntensity * Math.PI);
  lights.add(hemi);
  const key = new THREE.DirectionalLight(m.key, L.keyIntensity);
  key.castShadow = true;
  key.shadow.mapSize.set(L.shadowMapPx, L.shadowMapPx);
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.02;
  const rim = new THREE.DirectionalLight(m.rim, L.rimIntensity);
  lights.add(key, key.target, rim, rim.target);

  if (shot.camera) {
    const cam = new THREE.Vector3(...shot.camera.position);
    const subj = new THREE.Vector3(...shot.camera.subjectPoint);
    const view = subj.clone().sub(cam).setY(0).normalize(); // camera forward (horizontal)
    const back = view.clone().negate(); // from subject toward camera
    const at = (azDeg: number, elDeg: number, dist: number) => {
      const d = back.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), azDeg * DEG);
      d.y = Math.tan(elDeg * DEG);
      return subj.clone().addScaledVector(d.normalize(), dist);
    };
    const wide = shot.camera.framing === "WS" || shot.camera.framing === "EWS";
    const r = wide ? 34 : 16;
    key.position.copy(at(L.keyAzimuthDeg, L.keyElevationDeg, 60));
    key.target.position.copy(subj);
    const sc = key.shadow.camera as THREE.OrthographicCamera;
    sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 1; sc.far = 140;
    sc.updateProjectionMatrix();
    rim.position.copy(at(L.rimAzimuthDeg, L.rimElevationDeg, 60));
    rim.target.position.copy(subj);
  }

  const update = (t: number) => {
    rigs.forEach((r, i) => {
      const c = shot.chars[i];
      applyPose(r, c.pose, t, shot.dur, { ...shot.micro, headTurn: i % 2 === 0 ? shot.micro.headTurn : -shot.micro.headTurn }, { holdAngle: c.holdAngle, seatTop: c.seatTop, holdArm: c.holdArm, phase: i * 1.7 + (c.pos[0] ?? 0) * 0.3 });
    });
    scene.updateMatrixWorld(true);
  };
  update(0);
  return { scene, set, rigs, lights, update };
}

// ---------------------------------------------------------------- camera solver

const C = S.camera;
export const FOCAL_PX = (S.format.height / 2) / Math.tan((C.vfovDeg / 2) * DEG);

function headInfo(r: Rig) {
  const p = new THREE.Vector3();
  r.face.getWorldPosition(p);
  const h = S.avatar.head[1] * r.spec.scale * r.spec.headScale;
  return { p, h, yaw: r.root.rotation.y / DEG };
}

function circularMeanDeg(a: number[]) {
  const x = a.reduce((s, v) => s + Math.cos(v * DEG), 0), y = a.reduce((s, v) => s + Math.sin(v * DEG), 0);
  return Math.abs(x) + Math.abs(y) < 1e-6 ? 0 : Math.atan2(y, x) / DEG;
}

/**
 * Solve a camera for a framing. Rules (style bible §3): pitch +8.5 deg up and roll 0 for character framings,
 * subject face at 0.30 of frame height, head size from framingsHeadPx at zoom 1.0. Inserts look straight at
 * the text plane (roll 0) and place it at 0.42 of frame height, clear of the caption zone.
 */
export function solveCamera(built: BuiltShot, shotChars: { id: string }[], framing: Framing, subject: string, azimuth: number): ShotCamera {
  const cam = new THREE.PerspectiveCamera(C.vfovDeg, S.format.width / S.format.height, 0.1, 600);
  const rigOf = (id: string) => {
    const i = shotChars.findIndex((c) => c.id === id);
    if (i < 0) throw new Error(`camera subject ${id} not in shot`);
    return built.rigs[i];
  };
  const [who, rawPart] = subject.split(".");
  const part = rawPart === "wrists" ? "wrist" : rawPart;
  let clamped = false;
  let subjectPoint = new THREE.Vector3();
  const minY = built.set.interior ? 0.6 : 0.45;

  if (framing === "INS") {
    let W = new THREE.Vector3(), n = new THREE.Vector3(), width = 1;
    if (part === "wrist" || part === "ledger") {
      const rigs = who === "pair" ? built.rigs.slice(0, 2) : [rigOf(who)];
      const pts = rigs.map((r) => (part === "ledger" ? r.ledger! : r.wrist));
      pts.forEach((o) => {
        const wp = new THREE.Vector3(); o.getWorldPosition(wp); W.add(wp);
        const q = new THREE.Quaternion(); o.getWorldQuaternion(q);
        n.add(new THREE.Vector3(0, part === "ledger" ? 1 : 0, part === "ledger" ? 0 : 1).applyQuaternion(q));
      });
      W.multiplyScalar(1 / pts.length); n.normalize();
      const s = rigs[0].spec.scale;
      width = part === "ledger" ? 2.5 * s : who === "pair" ? pts[0].getWorldPosition(new THREE.Vector3()).distanceTo(pts[1].getWorldPosition(new THREE.Vector3())) + 1.4 : 0.9 * s * 1.7;
    } else if (part === "hands") {
      const rigs = built.rigs.slice(0, 2);
      rigs.forEach((r) => [r.armL, r.armR].forEach((a) => { const hp = new THREE.Vector3(0, -S.avatar.arm[1], 0); a.localToWorld(hp); W.add(hp); }));
      W.multiplyScalar(1 / 4);
      n.set(0, Math.tan(22 * DEG), 1).normalize();
      width = 3.4 * rigs[0].spec.scale;
    } else throw new Error(`bad insert subject ${subject}`);
    n.applyAxisAngle(new THREE.Vector3(0, 1, 0), azimuth * DEG);
    const d = (FOCAL_PX * width) / (S.format.width * 0.62);
    cam.position.copy(W.clone().addScaledVector(n, d));
    if (cam.position.y < minY) { cam.position.y = minY; clamped = true; }
    cam.up.set(0, 1, 0);
    cam.lookAt(W);
    const dy = Math.atan(((0.5 - 0.42) * S.format.height) / FOCAL_PX);
    cam.rotateX(-dy);
    subjectPoint = W;
  } else {
    let P: THREE.Vector3, Hh: number, facing: number;
    if (who === "focus") {
      const fp = built.set.focus[part];
      if (!fp) throw new Error(`no focus ${part}`);
      P = new THREE.Vector3(...fp); Hh = 1.2; facing = 0;
    } else if (who === "pair") {
      const a = headInfo(built.rigs[0]), b = headInfo(built.rigs[1]);
      P = a.p.clone().add(b.p).multiplyScalar(0.5); Hh = Math.max(a.h, b.h); facing = circularMeanDeg([a.yaw, b.yaw]);
      if (Math.abs(Math.abs(a.yaw - b.yaw) - 180) < 1) facing = 0; // facing each other: shoot from the set front
    } else {
      const h = headInfo(rigOf(who));
      P = h.p; Hh = h.h; facing = h.yaw;
    }
    const headPx = (C.framingsHeadPx as Record<string, number>)[framing];
    const d = (FOCAL_PX * Hh) / headPx;
    const el = C.pitchDeg * DEG + Math.atan(((0.5 - C.faceYFracTarget) * S.format.height) / FOCAL_PX);
    const yaw = (facing + azimuth) * DEG;
    const dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const pos = P.clone().addScaledVector(dir, d * Math.cos(el));
    pos.y = P.y - d * Math.sin(el);
    if (pos.y < minY) { pos.y = minY; clamped = true; }
    cam.position.copy(pos);
    // three cameras look down local -z: yaw = atan2 of dir makes -z point back at the subject; +X pitches up
    cam.rotation.set(C.pitchDeg * DEG, yaw, 0, "YXZ");
    subjectPoint = P;
  }
  cam.updateMatrixWorld(true);
  const e = new THREE.Euler().setFromQuaternion(cam.quaternion, "YXZ");
  return {
    framing, subject, azimuth,
    position: cam.position.toArray().map((v) => +v.toFixed(4)) as Vec3,
    quaternion: cam.quaternion.toArray().map((v) => +v.toFixed(6)) as [number, number, number, number],
    pitchDeg: +(e.x / DEG).toFixed(3), rollDeg: +(e.z / DEG).toFixed(3), vfovDeg: C.vfovDeg,
    zoomFrom: C.pushFrom, zoomTo: C.pushTo,
    focusDistance: +cam.position.distanceTo(subjectPoint).toFixed(3),
    subjectPoint: subjectPoint.toArray().map((v) => +v.toFixed(4)) as Vec3,
    clamped,
  };
}

export function makeCamera(c: ShotCamera, zoom: number) {
  const cam = new THREE.PerspectiveCamera(c.vfovDeg, S.format.width / S.format.height, 0.1, 600);
  cam.position.set(...c.position);
  cam.quaternion.set(...c.quaternion);
  cam.zoom = zoom;
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
  return cam;
}

export { POSES };
