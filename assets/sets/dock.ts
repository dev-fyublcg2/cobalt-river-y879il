// Pier over the lake. Text: PIER 4, NO DIVING, boat LUCKY. Sun disc for the dawn mood.
import * as THREE from "three";
import { box, cyl, mat, sign, STANDARD_MARKS, type Factories, type SetBuild } from "./common";

export function build(f: Factories): SetBuild {
  const g = new THREE.Group();
  const water = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), mat("#3E7FB0", { rough: 0.35 }));
  water.rotation.x = -Math.PI / 2; water.position.y = -1.2; water.receiveShadow = true; g.add(water);
  for (let i = 0; i < 9; i++) box(g, [3 + (i % 3), 0.04, 0.12], [-14 + i * 4.1, -1.17, -6 - (i % 4) * 5], "#9CC6E4", { cast: false }); // glints
  // pier deck from z=+30 to z=-14
  for (let z = 30; z > -14; z -= 1.1) box(g, [6, 0.3, 1.0], [0, -0.15, z], z % 2.2 < 1.1 ? "#9A6B3F" : "#8A5E36", { cast: false });
  for (const z of [26, 18, 10, 2, -6, -13])
    for (const x of [-3.1, 3.1]) cyl(g, 0.3, 0.3, 3.4, [x, -0.6, z], "#6A4626");
  for (const z of [10, 2, -6, -13]) for (const x of [-3.1, 3.1]) cyl(g, 0.22, 0.22, 1.6, [x, 0.8, z], "#7A5230");
  // sign post + sign
  cyl(g, 0.14, 0.14, 4.6, [-2.8, 2.3, -4.4], "#6A4626");
  sign(g, f, { text: "PIER 4", w: 2.8, h: 1.0, fg: "#FFFFFF", bg: "#2F5D9E", border: "#FFFFFF" }, [-2.8, 4.4, -4.3], { id: "sign:pier", rotY: 0.2 });
  sign(g, f, { text: "NO DIVING", w: 2.4, h: 0.9, fg: "#B5523B", bg: "#FFFFFF", border: "#B5523B" }, [2.9, 1.7, -6.0], { id: "sign:nodiving", backing: "#FFFFFF" });
  // boat
  const boat = new THREE.Group(); boat.position.set(7.2, -1.0, -9); boat.rotation.y = -0.3;
  box(boat, [3.0, 1.0, 6.6], [0, 0.4, 0], "#FFFFFF"); box(boat, [3.2, 0.25, 6.8], [0, 0.95, 0], "#B5523B");
  sign(boat, f, { text: "LUCKY", w: 2.0, h: 0.6, fg: "#2F5D9E", bg: "#FFFFFF" }, [-1.52, 0.45, 0], { id: "sign:boat", rotY: -Math.PI / 2 });
  g.add(boat);
  // ducks: body + head + beak, all boxes
  const ducks = new THREE.Group(); ducks.position.set(-5.2, -1.15, -5.5);
  for (const [x, z, r] of [[0, 0, 0.4], [1.6, -1.2, -0.3], [-1.3, -1.8, 0.9]] as const) {
    const d = new THREE.Group(); d.position.set(x, 0, z); d.rotation.y = r;
    box(d, [0.9, 0.55, 1.3], [0, 0.28, 0], "#FFD400"); box(d, [0.6, 0.6, 0.6], [0, 0.85, 0.45], "#FFD400"); box(d, [0.3, 0.16, 0.35], [0, 0.82, 0.88], "#E07A2F");
    ducks.add(d);
  }
  g.add(ducks);
  // far shore + sun
  box(g, [400, 3, 20], [0, 0.3, -140], "#2F5F3A", { cast: false });
  for (let i = 0; i < 14; i++) box(g, [6, 6 + (i % 4) * 2, 6], [-90 + i * 14, 3, -132], "#2A5534", { cast: false });
  const sun = new THREE.Mesh(new THREE.CircleGeometry(9, 40), new THREE.MeshBasicMaterial({ color: "#FFE7B0" }));
  sun.position.set(-26, 8, -150); sun.name = "sun"; g.add(sun);
  return {
    group: g, interior: false, texts: ["PIER 4", "NO DIVING", "LUCKY"],
    marks: { ...STANDARD_MARKS, pierL: { pos: [-1.2, 0, -2.5], yaw: 0 }, pierR: { pos: [1.2, 0, -2.5], yaw: 0 } },
    focus: { ducks: [-5.2, -0.4, -6.3] },
  };
}
