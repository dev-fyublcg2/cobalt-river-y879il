// Maple St: sidewalk in front of a shop row. Text: MAPLE ST, BAKERY, EVERY DAY COUNTS.
import * as THREE from "three";
import { box, building, cyl, ground, sign, STANDARD_MARKS, tree, type Factories, type SetBuild } from "./common";

export function build(f: Factories): SetBuild {
  const g = new THREE.Group();
  ground(g, "#5FA83F");
  box(g, [80, 0.12, 8], [0, 0.06, -1], "#BFC3C7", { cast: false });           // sidewalk
  for (let x = -40; x < 40; x += 3) box(g, [0.05, 0.13, 8], [x, 0.065, -1], "#A9ADB1", { cast: false });
  box(g, [80, 0.1, 9], [0, 0.05, -9.5], "#4A4E52", { cast: false });           // road
  for (let x = -38; x < 40; x += 6) box(g, [2.6, 0.11, 0.3], [x, 0.06, -9.5], "#FFD400", { cast: false });
  box(g, [80, 0.3, 0.6], [0, 0.15, -5], "#D9DCDF", { cast: false });           // curb
  building(g, 9, 11, 6, [-11, 0, -19], "#B5523B", { roof: "#7A3E2A" });
  const bakery = building(g, 10, 9, 6, [0, 0, -18], "#E8DCC6", { windows: false });
  box(bakery, [8, 3.2, 0.2], [0, 1.9, 3.05], "#BFE3F5", { cast: false });
  box(bakery, [10.4, 0.7, 1.4], [0, 4.1, 3.4], "#FF8FB1");                      // awning
  sign(bakery, f, { text: "BAKERY", w: 6.4, h: 1.6, fg: "#FFFFFF", bg: "#B5523B" }, [0, 6.2, 3.1], { id: "sign:bakery" });
  building(g, 8, 13, 6, [10.5, 0, -19], "#6FA8FF", { trim: "#FFFFFF" });
  building(g, 9, 10, 6, [20, 0, -20], "#FFD9A0");
  building(g, 9, 12, 6, [-21, 0, -20], "#8E5BA8");
  // street sign on a pole
  cyl(g, 0.12, 0.12, 6.4, [-6.2, 3.2, -3.6], "#7C8288");
  sign(g, f, { text: "MAPLE ST", w: 3.6, h: 0.9, fg: "#FFFFFF", bg: "#2F8F4F", border: "#FFFFFF" }, [-6.2, 6.0, -3.5], { id: "sign:maple", rotY: 0.25 });
  // billboard
  cyl(g, 0.25, 0.25, 7, [7.5, 3.5, -12.6], "#7C8288");
  sign(g, f, { text: "EVERY DAY COUNTS", w: 7.4, h: 2.6, fg: "#111111", bg: "#FFD400" }, [7.5, 8.4, -12.4], { id: "sign:billboard", backing: "#111111" });
  for (const x of [-16, -3.5, 14]) {
    cyl(g, 0.1, 0.12, 5.5, [x, 2.75, -4.4], "#5B6168");
    box(g, [0.7, 0.4, 0.7], [x, 5.6, -4.4], "#FFF3C4", { cast: false });
  }
  tree(g, [-9, 0, -6.2]); tree(g, [12, 0, -6.4], 0.9); tree(g, [-26, 0, -8]); tree(g, [26, 0, -7]);
  return {
    group: g, interior: false, texts: ["MAPLE ST", "BAKERY", "EVERY DAY COUNTS"],
    marks: { ...STANDARD_MARKS, cafe: { pos: [-1.6, 0, -1.0], yaw: 30 }, cafe2: { pos: [1.6, 0, -1.0], yaw: -30 } },
    focus: { street: [0, 3, -8] },
  };
}
