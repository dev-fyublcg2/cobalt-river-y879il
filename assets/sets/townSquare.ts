// Town square of Tally. Text: TOWN HALL, WELCOME TO TALLY banner, TALLY & SONS (Uncle's office).
import * as THREE from "three";
import { box, building, cyl, ground, sign, STANDARD_MARKS, tree, wedge, type Factories, type SetBuild } from "./common";

export function build(f: Factories): SetBuild {
  const g = new THREE.Group();
  ground(g, "#5FA83F");
  box(g, [60, 0.1, 30], [0, 0.05, -6], "#C9C2B4", { cast: false });
  for (let x = -28; x <= 28; x += 2.5) box(g, [0.06, 0.11, 30], [x, 0.06, -6], "#B5AE9F", { cast: false });
  const hall = building(g, 16, 12, 8, [0, 0, -24], "#F4ECD8", { trim: "#B5523B" });
  wedge(hall, [17, 3, 9], [0, 12.4, 0], "#B5523B");
  sign(hall, f, { text: "TOWN HALL", w: 8.4, h: 1.6, fg: "#FFFFFF", bg: "#B5523B" }, [0, 10.2, 4.1], { id: "sign:hall" });
  box(g, [4, 9, 4], [0, 18, -24], "#E8DCC6");
  cyl(g, 1.4, 1.4, 0.2, [0, 19.5, -21.9], "#FFFFFF", { rotX: Math.PI / 2 });
  box(g, [0.15, 1.1, 0.1], [0, 19.9, -21.75], "#111111");
  const office = building(g, 10, 11, 6, [-15, 0, -16], "#5B6F8A", { trim: "#FFFFFF" });
  office.rotation.y = 0.35;
  sign(office, f, { text: "TALLY & SONS", w: 7.4, h: 1.3, fg: "#FFD400", bg: "#111111" }, [0, 3.6, 3.1], { id: "sign:office" });
  box(office, [2.6, 2.8, 0.15], [0, 1.4, 3.05], "#24304F");
  building(g, 9, 9, 6, [15, 0, -17], "#FFD9A0", { trim: "#B5523B" }).rotation.y = -0.35;
  // banner between two poles
  for (const x of [-6.5, 6.5]) cyl(g, 0.14, 0.14, 9.5, [x, 4.75, -10.5], "#5B6168");
  sign(g, f, { text: "WELCOME TO TALLY", w: 12, h: 1.8, fg: "#111111", bg: "#FFD400", border: "#111111" }, [0, 8.4, -10.4], { id: "sign:banner" });
  // fountain
  cyl(g, 3.2, 3.4, 1.0, [0, 0.5, -6.5], "#BFC3C7"); cyl(g, 2.7, 2.7, 0.2, [0, 1.0, -6.5], "#6FA8FF");
  cyl(g, 0.5, 0.6, 3.2, [0, 1.6, -6.5], "#BFC3C7");
  tree(g, [-24, 0, -8]); tree(g, [24, 0, -9], 1.1);
  return { group: g, interior: false, texts: ["TOWN HALL", "WELCOME TO TALLY", "TALLY & SONS"], marks: { ...STANDARD_MARKS, office: { pos: [-6.0, 0, -3.0], yaw: 30 }, office2: { pos: [-3.0, 0, -2.4], yaw: 10 } }, focus: {} };
}
