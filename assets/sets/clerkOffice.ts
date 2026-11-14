// Town clerk office. Text: TOWN CLERK, MS. GRAY desk plate, NO TAKE-BACKS poster (+ the ledger the clerk holds).
import * as THREE from "three";
import { shifted, box, room, sign, STANDARD_MARKS, type Factories, type SetBuild } from "./common";

export function build(f: Factories): SetBuild {
  const g = new THREE.Group();
  room(g, { halfW: 11, backZ: 6, height: 12, wall: "#E8DCC6", floor: "#7A5230", side: "#D9C8A8" });
  for (let x = -10; x <= 10; x += 1.6) box(g, [0.05, 0.21, 51], [x, 0, 19.5], "#6A4626", { cast: false });
  box(g, [22, 4, 0.1], [0, 2, -5.92], "#B9A47F", { cast: false }); // wainscot
  sign(g, f, { text: "TOWN CLERK", w: 7.0, h: 1.5, fg: "#FFD400", bg: "#111111" }, [0, 10.0, -5.9], { id: "sign:clerk" });
  sign(g, f, { text: "NO TAKE-BACKS", w: 3.6, h: 4.4, fg: "#B5523B", bg: "#F4ECD8", lines: ["NO", "TAKE-", "BACKS!"], border: "#B5523B" }, [6.2, 6.6, -5.9], { id: "sign:poster" });
  // shelves of ledgers
  box(g, [5.6, 8, 1.4], [-7.0, 4, -5.2], "#8A5A33");
  for (let r = 0; r < 4; r++) {
    box(g, [5.4, 0.2, 1.3], [-7.0, 1 + r * 2, -5.1], "#6A4626");
    for (let c = 0; c < 6; c++) box(g, [0.7, 1.5, 1.0], [-9.2 + c * 0.88, 1.85 + r * 2, -5.0], ["#7A2E22", "#2F5D9E", "#2F8F4F", "#8E5BA8"][(r + c) % 4]);
  }
  // desk behind which the clerk stands (front edge at z=0.8)
  box(g, [6.8, 3.0, 2.2], [0, 1.5, -0.6], "#8A5A33");
  box(g, [7.0, 0.25, 2.4], [0, 3.1, -0.6], "#6A4626");
  sign(g, f, { text: "MS. GRAY", w: 2.4, h: 0.6, fg: "#FFFFFF", bg: "#2F5D9E" }, [2.0, 3.55, 0.25], { id: "sign:plate", rotX: -0.35, backing: "#111111" });
  box(g, [1.2, 0.8, 0.8], [-2.4, 3.6, -1.0], "#BFC3C7"); // stamp box
  return {
    group: g, interior: true, texts: ["TOWN CLERK", "MS. GRAY", "NO TAKE-BACKS"],
    marks: { ...shifted(STANDARD_MARKS, 2.6), desk: { pos: [0, 0, -2.6], yaw: 0 }, front: { pos: [1.6, 0, 2.8], yaw: -150 }, frontL: { pos: [-3.6, 0, 1.6], yaw: 40 } },
    focus: { poster: [6.2, 6.6, -5.9] },
  };
}
