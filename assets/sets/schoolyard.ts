// Maple School yard + staff lot. Text: MAPLE SCHOOL, PARKING, CAFETERIA.
import * as THREE from "three";
import { box, building, cyl, ground, sign, STANDARD_MARKS, tree, type Factories, type SetBuild } from "./common";

function car(parent: THREE.Object3D, pos: [number, number, number], color: string, rotY = 0) {
  const c = new THREE.Group(); c.position.set(...pos); c.rotation.y = rotY;
  box(c, [3.6, 1.4, 7.0], [0, 1.2, 0], color);
  box(c, [3.2, 1.2, 3.6], [0, 2.5, -0.4], color);
  box(c, [3.25, 0.9, 3.0], [0, 2.5, -0.4], "#BFE3F5", { cast: false });
  for (const [x, z] of [[-1.8, 2.2], [1.8, 2.2], [-1.8, -2.2], [1.8, -2.2]]) cyl(c, 0.65, 0.65, 0.5, [x, 0.65, z], "#1E1E1E", { rotZ: Math.PI / 2 });
  parent.add(c);
}

export function build(f: Factories): SetBuild {
  const g = new THREE.Group();
  ground(g, "#5FA83F");
  box(g, [70, 0.1, 16], [0, 0.05, -4], "#4A4E52", { cast: false });
  for (let x = -30; x <= 30; x += 5) box(g, [0.2, 0.11, 5], [x, 0.06, -9], "#FFFFFF", { cast: false });
  const school = building(g, 26, 10, 8, [-4, 0, -22], "#B5523B", { trim: "#F4ECD8" });
  sign(school, f, { text: "MAPLE SCHOOL", w: 11, h: 1.8, fg: "#FFFFFF", bg: "#2F5D9E", border: "#FFFFFF" }, [0, 8.4, 4.1], { id: "sign:school" });
  box(school, [4, 5.6, 0.2], [6, 2.8, 4.05], "#6A4626");
  sign(school, f, { text: "CAFETERIA", w: 4.6, h: 1.0, fg: "#111111", bg: "#FFD400" }, [6, 6.3, 4.12], { id: "sign:cafeteria" });
  cyl(g, 0.12, 0.12, 5.2, [-6.4, 2.6, -4.8], "#7C8288");
  sign(g, f, { text: "PARKING", w: 2.6, h: 2.2, fg: "#FFFFFF", bg: "#2F5D9E", lines: ["P", "PARKING"], border: "#FFFFFF" }, [-6.4, 5.4, -4.7], { id: "sign:parking", rotY: 0.18 });
  car(g, [-11.5, 0, -9], "#FFD400", 0.1);
  car(g, [11, 0, -10], "#6FA8FF", -0.15);
  // hoop
  cyl(g, 0.2, 0.2, 8, [15, 4, -6], "#7C8288");
  box(g, [3, 2, 0.2], [15, 8.2, -5.8], "#FFFFFF");
  box(g, [1.2, 0.1, 1.2], [15, 7.5, -5.2], "#E07A2F");
  tree(g, [-22, 0, -12]); tree(g, [22, 0, -14], 1.1); tree(g, [-30, 0, -16]);
  return { group: g, interior: false, texts: ["MAPLE SCHOOL", "PARKING", "CAFETERIA"], marks: { ...STANDARD_MARKS }, focus: {} };
}
