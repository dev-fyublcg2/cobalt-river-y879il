// Parametric 6-part blocky humanoid: head, torso, armL, armR, legL, legR.
// Arms pivot at the shoulder top, legs at the hip top. Faces are a flat sprite plane on the head front.
// Clothes are separate shells 0.02 units larger than the part they cover. No fingers, toes, ears, bones.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import styleJson from "../../spec/style.json";
import { CAST, type CharacterSpec } from "./cast";
import { mat, type Factories } from "../sets/common";

const A = styleJson.avatar;
export const ARM_X = A.torso[0] / 2 + A.armGapFromTorso + A.arm[0] / 2; // 1.65
export const SHOULDER_Y = A.leg[1] + A.torso[1]; // 4 (unscaled)
export const HIP_Y = A.leg[1]; // 2

export type Rig = {
  spec: CharacterSpec;
  root: THREE.Group;      // placed at mark, yaw
  body: THREE.Group;      // scaled; y offset for ground contact
  torsoPivot: THREE.Group;
  headPivot: THREE.Group;
  armL: THREE.Group; armR: THREE.Group; legL: THREE.Group; legR: THREE.Group;
  meshes: Record<"head" | "torso" | "armL" | "armR" | "legL" | "legR", THREE.Mesh>;
  face: THREE.Mesh;
  wrist: THREE.Mesh;
  ledger?: THREE.Group;
};

export type FaceLoader = (expression: string) => THREE.Texture | null;

export function buildAvatar(id: string, f: Factories, faceTex: FaceLoader, opts: { face: string; wrist?: string; ledger?: string | null }): Rig {
  const spec = CAST[id];
  if (!spec) throw new Error(`unknown character ${id}`);
  const co = A.clothOffset * 2;
  const root = new THREE.Group();
  root.name = `char:${id}`;
  const body = new THREE.Group();
  body.scale.setScalar(spec.scale);
  root.add(body);

  const skin = mat(spec.skin, { rough: 0.7 });
  const shoe = mat("#2A2A2A", { rough: 0.6 });
  const pants = f.pattern(spec.pants);
  const shirt = f.pattern({ ...spec.shirt, seed: id.length });

  const mk = (g: THREE.BufferGeometry, m: THREE.Material, name: string) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.name = name;
    return mesh;
  };

  // legs
  const leg = (side: 1 | -1, name: "legL" | "legR") => {
    const pivot = new THREE.Group();
    pivot.position.set(side * A.leg[0] / 2, HIP_Y, 0);
    const m = mk(new THREE.BoxGeometry(...(A.leg as [number, number, number])), shoe, name);
    m.position.y = -A.leg[1] / 2;
    pivot.add(m);
    const shell = mk(new THREE.BoxGeometry(A.leg[0] + co, A.leg[1] * 0.86, A.leg[2] + co), pants, name + ":pants");
    shell.position.y = -A.leg[1] * 0.43;
    pivot.add(shell);
    body.add(pivot);
    return { pivot, m };
  };
  const lL = leg(1, "legL");
  const lR = leg(-1, "legR");

  const torsoPivot = new THREE.Group();
  torsoPivot.position.y = HIP_Y;
  body.add(torsoPivot);
  const torso = mk(new THREE.BoxGeometry(...(A.torso as [number, number, number])), skin, "torso");
  torso.position.y = A.torso[1] / 2;
  torsoPivot.add(torso);
  const shirtShell = mk(new THREE.BoxGeometry(A.torso[0] + co, A.torso[1] + co, A.torso[2] + co), shirt, "torso:shirt");
  shirtShell.position.y = A.torso[1] / 2;
  torsoPivot.add(shirtShell);
  // pants waistband shell so the shirt/pants boundary reads
  const band = mk(new THREE.BoxGeometry(A.torso[0] + co * 1.5, 0.28, A.torso[2] + co * 1.5), pants, "torso:band");
  band.position.y = 0.14;
  torsoPivot.add(band);

  const arm = (side: 1 | -1, name: "armL" | "armR") => {
    const pivot = new THREE.Group();
    pivot.position.set(side * ARM_X, A.torso[1], 0);
    const m = mk(new THREE.BoxGeometry(...(A.arm as [number, number, number])), skin, name);
    m.position.y = -A.arm[1] / 2;
    pivot.add(m);
    const len = spec.sleeves === "long" ? A.arm[1] * 0.78 : A.arm[1] * 0.42;
    const sleeve = mk(new THREE.BoxGeometry(A.arm[0] + co, len, A.arm[2] + co), shirt, name + ":sleeve");
    sleeve.position.y = -len / 2 + co / 2;
    pivot.add(sleeve);
    torsoPivot.add(pivot);
    return { pivot, m };
  };
  const aL = arm(1, "armL");
  const aR = arm(-1, "armR");

  // head
  const hs = spec.headScale;
  const headPivot = new THREE.Group();
  headPivot.position.y = A.torso[1] + 0.02;
  torsoPivot.add(headPivot);
  const [hw, hh, hd] = A.head as [number, number, number];
  const head = mk(new RoundedBoxGeometry(hw, hh, hd, 3, 0.16), skin, "head");
  head.position.y = hh / 2;
  const headGroup = new THREE.Group();
  headGroup.scale.setScalar(hs);
  headGroup.add(head);
  headPivot.add(headGroup);

  if (spec.hair) {
    const hm = mat(spec.hair.color, { rough: 0.8 });
    const cap = mk(new THREE.BoxGeometry(hw + 0.06, 0.34, hd + 0.06), hm, "hair");
    cap.position.set(0, hh - 0.13, 0);
    headGroup.add(cap);
    const back = mk(new THREE.BoxGeometry(hw + 0.06, spec.hair.style === "long" ? 1.5 : 0.85, 0.2), hm, "hair:back");
    back.position.set(0, spec.hair.style === "long" ? hh - 0.75 : hh - 0.45, -hd / 2 - 0.13);
    headGroup.add(back);
    if (spec.hair.style === "bun") {
      const bun = mk(new THREE.BoxGeometry(0.6, 0.5, 0.5), hm, "hair:bun");
      bun.position.set(0, hh + 0.2, -0.25);
      headGroup.add(bun);
    }
    if (spec.hair.style === "pigtails") {
      for (const s of [-1, 1]) {
        const pt = mk(new THREE.BoxGeometry(0.34, 0.5, 0.34), hm, "hair:pigtail");
        pt.position.set(s * (hw / 2 + 0.2), hh - 0.12, -0.1);
        headGroup.add(pt);
      }
    }
  }

  const faceMat = new THREE.MeshStandardMaterial({ map: faceTex(opts.face) ?? undefined, transparent: true, alphaTest: 0.02, roughness: 0.75, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false, color: faceTex(opts.face) ? "#FFFFFF" : "#111111", opacity: faceTex(opts.face) ? 1 : 0 });
  const fs = A.head[1] * styleJson.faces.planeFracOfHeadFront;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(fs, fs), faceMat);
  face.name = "face";
  face.position.set(0, hh / 2 - 0.02, hd / 2 + 0.006);
  face.userData = { face: opts.face };
  headGroup.add(face);

  // wrist number: flat tag on the front face of the left forearm, near the hand
  const wristText = opts.wrist ?? spec.wrist;
  const wrist = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), f.text({ text: wristText, w: 0.9, h: 0.5, fg: "#111111", bg: "#F4ECD8", font: "sign", border: "#111111" }));
  wrist.position.set(0, -A.arm[1] * 0.74, A.arm[2] / 2 + co / 2 + 0.012);
  wrist.name = "wrist";
  wrist.userData = { worldText: wristText, textId: `wrist:${id}` };
  aL.pivot.add(wrist);

  const rig: Rig = {
    spec, root, body, torsoPivot, headPivot, armL: aL.pivot, armR: aR.pivot, legL: lL.pivot, legR: lR.pivot,
    meshes: { head, torso, armL: aL.m, armR: aR.m, legL: lL.m, legR: lR.m }, face, wrist,
  };

  if (opts.ledger) {
    const lg = new THREE.Group();
    lg.name = "ledger";
    const cover = mk(new THREE.BoxGeometry(2.24, 0.16, 1.5), mat("#7A2E22", { rough: 0.6 }), "ledger:cover");
    lg.add(cover);
    const pageL = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 1.36), f.text({ text: "", w: 1.04, h: 1.36, bg: "#F4ECD8", fg: "#111111", font: "hand", lines: ledgerPages(opts.ledger)[0] }));
    pageL.rotation.x = -Math.PI / 2; pageL.position.set(-0.55, 0.085, 0);
    pageL.userData = { worldText: ledgerPages(opts.ledger)[0].join(" "), textId: "ledger:left" };
    const pageR = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 1.36), f.text({ text: "", w: 1.04, h: 1.36, bg: "#F4ECD8", fg: "#111111", font: "hand", lines: ledgerPages(opts.ledger)[1] }));
    pageR.rotation.x = -Math.PI / 2; pageR.position.set(0.55, 0.085, 0);
    pageR.userData = { worldText: ledgerPages(opts.ledger)[1].join(" "), textId: "ledger:right" };
    lg.add(pageL, pageR);
    torsoPivot.add(lg);
    rig.ledger = lg;
  }
  return rig;
}

export function ledgerPages(kind: string): [string[], string[]] {
  if (kind === "page1") return [["PAGE 1", "", "DAYS GIVEN", "AWAY ARE", "DAYS SPENT", "TOGETHER."], ["", "YOU DON'T", "LOSE THE DAY.", "YOU ONLY", "LOSE IT", "ALONE."]];
  return [["RULES", "OF TALLY", "", "1. YOU", "CAN GIVE."], ["2. YOU CAN", "NEVER", "TAKE BACK.", "", "- CLERK"]];
}
