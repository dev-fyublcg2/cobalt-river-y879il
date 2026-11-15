// Chunky primitive kit shared by every set: boxes, wedges, cylinders, flat sign planes.
// Node-safe: text/pattern rendering is injected through Factories so QC tools can build sets without a DOM.
import * as THREE from "three";

export type Vec3 = [number, number, number];
export type Mark = { pos: Vec3; yaw: number; seatTop?: number; lie?: boolean };

export type TextSpec = {
  text: string; w: number; h: number;
  fg?: string; bg?: string; border?: string; font?: "sign" | "hand"; align?: "center" | "left"; lines?: string[];
};
export type PatternSpec = { kind: "stripes" | "plaid" | "dots" | "solid" | "suit" | "coat" | "track" | "apron"; colors: string[]; seed?: number };

export type Factories = {
  text: (spec: TextSpec) => THREE.Material;
  pattern: (spec: PatternSpec) => THREE.Material;
};

/** Plain-colour fallbacks (node / QC). */
export const nodeFactories: Factories = {
  text: (s) => new THREE.MeshStandardMaterial({ color: s.bg ?? "#FFFFFF", roughness: 0.9 }),
  pattern: (s) => new THREE.MeshStandardMaterial({ color: s.colors[0], roughness: 0.85 }),
};

const matCache = new Map<string, THREE.MeshStandardMaterial>();
export function mat(color: string, opts: { rough?: number; emissive?: string; emissiveIntensity?: number; metal?: number } = {}) {
  const key = `${color}|${opts.rough ?? 0.85}|${opts.emissive ?? ""}|${opts.emissiveIntensity ?? 0}|${opts.metal ?? 0}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.85, metalness: opts.metal ?? 0, emissive: opts.emissive ?? "#000000", emissiveIntensity: opts.emissiveIntensity ?? 0 });
    matCache.set(key, m);
  }
  return m;
}

type Shadow = { cast?: boolean; receive?: boolean };
function finish(m: THREE.Mesh, s: Shadow = {}) {
  m.castShadow = s.cast ?? true;
  m.receiveShadow = s.receive ?? true;
  return m;
}

export function box(parent: THREE.Object3D, size: Vec3, pos: Vec3, material: THREE.Material | string, s?: Shadow & { rotY?: number; rotX?: number; rotZ?: number; name?: string }) {
  const m = finish(new THREE.Mesh(new THREE.BoxGeometry(...size), typeof material === "string" ? mat(material) : material), s);
  m.position.set(...pos);
  if (s?.rotY) m.rotation.y = s.rotY;
  if (s?.rotX) m.rotation.x = s.rotX;
  if (s?.rotZ) m.rotation.z = s.rotZ;
  if (s?.name) m.name = s.name;
  parent.add(m);
  return m;
}

export function cyl(parent: THREE.Object3D, rTop: number, rBot: number, h: number, pos: Vec3, material: THREE.Material | string, s?: Shadow & { seg?: number; rotX?: number; rotZ?: number }) {
  const m = finish(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, s?.seg ?? 20), typeof material === "string" ? mat(material) : material), s);
  m.position.set(...pos);
  if (s?.rotX) m.rotation.x = s.rotX;
  if (s?.rotZ) m.rotation.z = s.rotZ;
  parent.add(m);
  return m;
}

/** Triangular-prism wedge (roofs, ramps). Width along x, slope rising toward -z. */
export function wedge(parent: THREE.Object3D, size: Vec3, pos: Vec3, material: THREE.Material | string, s?: Shadow & { rotY?: number }) {
  const [w, h, d] = size;
  const shape = new THREE.Shape();
  shape.moveTo(-d / 2, 0); shape.lineTo(d / 2, 0); shape.lineTo(-d / 2, h); shape.lineTo(-d / 2, 0);
  const g = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false });
  g.translate(0, 0, -w / 2);
  g.rotateY(Math.PI / 2);
  const m = finish(new THREE.Mesh(g, typeof material === "string" ? mat(material) : material), s);
  m.position.set(...pos);
  if (s?.rotY) m.rotation.y = s.rotY;
  parent.add(m);
  return m;
}

/** Flat diegetic text panel. Tagged so QC can project it into screen space. */
export function sign(parent: THREE.Object3D, f: Factories, spec: TextSpec, pos: Vec3, opts: { rotY?: number; rotX?: number; id?: string; backing?: string; depth?: number } = {}) {
  const g = new THREE.Group();
  g.position.set(...pos);
  g.rotation.set(opts.rotX ?? 0, opts.rotY ?? 0, 0, "YXZ");
  const depth = opts.depth ?? 0.12;
  if (opts.backing) box(g, [spec.w + 0.16, spec.h + 0.16, depth], [0, 0, -depth / 2 - 0.005], opts.backing);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(spec.w, spec.h), f.text(spec));
  plane.receiveShadow = true;
  plane.userData = { worldText: spec.text, textId: opts.id ?? spec.text };
  g.add(plane);
  parent.add(g);
  return g;
}

export function ground(parent: THREE.Object3D, color: string, size = 400) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat(color, { rough: 1 }));
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

export function tree(parent: THREE.Object3D, pos: Vec3, k = 1) {
  cyl(parent, 0.35 * k, 0.45 * k, 3.2 * k, [pos[0], 1.6 * k, pos[2]], "#7A5230");
  box(parent, [3.2 * k, 2.6 * k, 3.2 * k], [pos[0], 4.2 * k, pos[2]], "#4C9A3A");
  box(parent, [2.2 * k, 1.4 * k, 2.2 * k], [pos[0], 6.0 * k, pos[2]], "#5FA83F");
}

/** Windowed block building facing +z. */
export function building(parent: THREE.Object3D, w: number, h: number, d: number, pos: Vec3, color: string, opts: { windows?: boolean; roof?: string; trim?: string } = {}) {
  const g = new THREE.Group();
  g.position.set(...pos);
  box(g, [w, h, d], [0, h / 2, 0], color);
  box(g, [w + 0.4, 0.4, d + 0.4], [0, h + 0.2, 0], opts.trim ?? "#E8DCC6");
  if (opts.roof) wedge(g, [w + 0.6, 1.6, d + 0.6], [0, h + 0.4, 0], opts.roof);
  if (opts.windows !== false) {
    const cols = Math.max(1, Math.floor(w / 2.6));
    const rows = Math.max(1, Math.floor((h - 3.5) / 2.8));
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const x = -w / 2 + (c + 0.5) * (w / cols);
        const y = 4.2 + r * 2.8;
        box(g, [1.3, 1.6, 0.1], [x, y, d / 2 + 0.03], mat("#BFE3F5", { rough: 0.3 }), { cast: false });
        box(g, [1.5, 0.18, 0.2], [x, y - 0.9, d / 2 + 0.08], "#FFFFFF", { cast: false });
      }
  }
  parent.add(g);
  return g;
}

/** Interior shell: back wall at z=-backZ, side walls, floor and a ceiling; open to +z where cameras live. */
export function room(parent: THREE.Object3D, o: { halfW: number; backZ: number; height: number; wall: string; floor: string; side?: string; ceiling?: string; front?: number }) {
  const front = o.front ?? 45;
  const depth = o.backZ + front;
  const zc = (front - o.backZ) / 2;
  const fl = box(parent, [o.halfW * 2 + 2, 0.2, depth], [0, -0.1, zc], o.floor, { cast: false });
  fl.name = "floor";
  box(parent, [o.halfW * 2 + 2, o.height, 0.4], [0, o.height / 2, -o.backZ - 0.2], o.wall, { cast: false });
  box(parent, [0.4, o.height, depth], [-o.halfW - 0.2, o.height / 2, zc], o.side ?? o.wall, { cast: false });
  box(parent, [0.4, o.height, depth], [o.halfW + 0.2, o.height / 2, zc], o.side ?? o.wall, { cast: false });
  box(parent, [o.halfW * 2 + 2, 0.3, depth], [0, o.height + 0.15, zc], o.ceiling ?? "#D9CDB8", { cast: false, receive: false });
  box(parent, [o.halfW * 2 + 2, o.height, 0.4], [0, o.height / 2, front], o.side ?? o.wall, { cast: false });
  // baseboard trim for scale
  box(parent, [o.halfW * 2, 0.4, 0.1], [0, 0.2, -o.backZ + 0.05], "#FFFFFF", { cast: false });
}

export const STANDARD_MARKS: Record<string, Mark> = {
  c: { pos: [0, 0, 0], yaw: 0 },
  l: { pos: [-2.1, 0, 0.2], yaw: 18 },
  r: { pos: [2.1, 0, 0.2], yaw: -18 },
  ll: { pos: [-4.2, 0, -0.6], yaw: 25 },
  rr: { pos: [4.2, 0, -0.6], yaw: -25 },
  pl: { pos: [-1.6, 0, 0], yaw: 90 },
  pr: { pos: [1.6, 0, 0], yaw: -90 },
  b1: { pos: [-3.6, 0, -3.2], yaw: 30 },
  b2: { pos: [3.4, 0, -4.2], yaw: -20 },
  b3: { pos: [-1.0, 0, -6.5], yaw: 10 },
  b4: { pos: [5.6, 0, -8.0], yaw: -40 },
  b5: { pos: [-6.4, 0, -9.0], yaw: 50 },
};

export type SetBuild = {
  group: THREE.Group;
  marks: Record<string, Mark>;
  focus: Record<string, Vec3>;
  interior: boolean;
  texts: string[];
};

/** Standard marks pushed toward the camera (interiors whose furniture sits on the default marks). */
export function shifted(marks: Record<string, Mark>, dz: number, only = ["c", "l", "r", "ll", "rr", "pl", "pr"]): Record<string, Mark> {
  return Object.fromEntries(Object.entries(marks).map(([k, m]) => [k, only.includes(k) ? { ...m, pos: [m.pos[0], m.pos[1], m.pos[2] + dz] as Vec3 } : m]));
}
