// Family kitchen. Text: calendar MAY, CRUNCH-O cereal, fridge note MILK!
import * as THREE from "three";
import { shifted, box, cyl, room, sign, STANDARD_MARKS, type Factories, type SetBuild } from "./common";

export function build(f: Factories): SetBuild {
  const g = new THREE.Group();
  room(g, { halfW: 11, backZ: 6, height: 12, wall: "#F4E3B8", floor: "#9A6B3F", side: "#E8D3A0" });
  for (let x = -10; x <= 10; x += 2) box(g, [0.06, 0.21, 51], [x, 0.0, 19.5], "#87592F", { cast: false });
  // window with sky
  box(g, [5.2, 3.6, 0.1], [-5.5, 6.2, -5.92], "#BFE3F5", { cast: false });
  box(g, [5.6, 0.3, 0.4], [-5.5, 4.3, -5.8], "#FFFFFF");
  box(g, [0.2, 3.6, 0.2], [-5.5, 6.2, -5.82], "#FFFFFF");
  // counter + cabinets
  box(g, [9, 3, 2], [5, 1.5, -4.9], "#6FA8FF");
  box(g, [9.2, 0.3, 2.2], [5, 3.15, -4.9], "#E8DCC6");
  box(g, [9, 2.4, 1.2], [5, 8.4, -5.3], "#6FA8FF");
  // fridge
  box(g, [2.8, 6.6, 2.4], [-9.2, 3.3, -4.6], "#F4F7FA");
  box(g, [0.15, 1.6, 0.15], [-8.1, 4.4, -3.35], "#BFC3C7");
  sign(g, f, { text: "MILK!", w: 1.3, h: 1.0, fg: "#B5523B", bg: "#FFF6A8", font: "hand" }, [-9.4, 4.9, -3.38], { id: "sign:milk", rotY: 0.04 });
  sign(g, f, { text: "CRUNCH-O", w: 1.7, h: 2.1, fg: "#FFFFFF", bg: "#E07A2F", border: "#111111" }, [3.4, 4.35, -4.4], { id: "sign:cereal", backing: "#E07A2F", depth: 0.7 });
  sign(g, f, { text: "MAY", w: 2.6, h: 2.8, fg: "#111111", bg: "#FFFFFF", lines: ["MAY", "1 2 3 4", "5 6 7"] }, [1.2, 7.6, -5.95], { id: "sign:calendar" });
  // table + chairs + plates (the potato lives on Milo's plate)
  box(g, [6.4, 0.35, 3.4], [0, 3.1, 1.2], "#C98E5F");
  for (const [x, z] of [[-2.8, -0.2], [2.8, -0.2], [-2.8, 2.6], [2.8, 2.6]]) box(g, [0.35, 3.0, 0.35], [x, 1.45, z], "#8A5A33");
  for (const x of [-4.6, 4.6]) {
    box(g, [1.8, 0.3, 1.8], [x, 1.85, 1.2], "#8A5A33");
    for (const dx of [-0.75, 0.75]) for (const dz of [-0.75, 0.75]) box(g, [0.22, 1.85, 0.22], [x + dx, 0.93, 1.2 + dz], "#7A4A28");
  }
  for (const x of [-1.6, 1.6]) {
    box(g, [1.8, 0.3, 1.8], [x, 1.85, -1.4], "#8A5A33");
    box(g, [1.8, 2.4, 0.25], [x, 3.2, -2.25], "#8A5A33");
  }
  for (const [x, z] of [[-2.2, 1.2], [2.2, 1.2], [-1.2, 0.2], [1.2, 0.2]]) cyl(g, 0.55, 0.45, 0.12, [x, 3.34, z], "#FFFFFF", { seg: 24 });
  box(g, [0.5, 0.36, 0.42], [-1.2, 3.55, 0.2], "#D9A85C", { name: "potato" });
  cyl(g, 0.35, 0.3, 0.45, [0, 3.5, 1.4], "#7A3E2A"); // gravy boat
  return {
    group: g, interior: true, texts: ["MILK!", "CRUNCH-O", "MAY"],
    marks: {
      ...shifted(STANDARD_MARKS, 4.4),
      seatL: { pos: [-4.6, 0, 1.2], yaw: 90, seatTop: 2.0 }, seatR: { pos: [4.6, 0, 1.2], yaw: -90, seatTop: 2.0 },
      seatBL: { pos: [-1.6, 0, -1.4], yaw: 0, seatTop: 2.0 }, seatBR: { pos: [1.6, 0, -1.4], yaw: 0, seatTop: 2.0 },
      door: { pos: [-6.5, 0, 0.5], yaw: 35 },
    },
    focus: { table: [0, 3.4, 1.0], potato: [-1.2, 3.6, 0.2] },
  };
}
