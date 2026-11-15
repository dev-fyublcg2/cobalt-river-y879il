// Milo's bedroom. Text: SPACE CAMP poster, MILO door sign, clock 7:00. Mirror is a framed pale plane (no reflections).
import * as THREE from "three";
import { box, mat, room, sign, STANDARD_MARKS, type Factories, type SetBuild } from "./common";

export function build(f: Factories): SetBuild {
  const g = new THREE.Group();
  room(g, { halfW: 10, backZ: 6, height: 12, wall: "#A9C7FF", floor: "#C98E5F", side: "#93B6F2" });
  box(g, [8, 0.05, 6], [-4.5, 0.03, 0.5], "#FFD9A0", { cast: false }); // rug
  sign(g, f, { text: "SPACE CAMP", w: 3.6, h: 4.6, fg: "#FFD400", bg: "#24304F", lines: ["SPACE", "CAMP", "*  *  *"] }, [-6.2, 6.8, -5.92], { id: "sign:poster" });
  box(g, [3.2, 7, 0.2], [7.6, 3.5, -5.85], "#FFFFFF");
  sign(g, f, { text: "MILO", w: 2.2, h: 0.8, fg: "#111111", bg: "#FFD400" }, [7.6, 5.7, -5.72], { id: "sign:door" });
  // bed (left) with pillow + blanket
  box(g, [5.0, 1.6, 7.6], [-5.2, 0.8, -1.8], "#8A5A33");
  box(g, [4.8, 0.7, 7.2], [-5.2, 1.95, -1.8], "#FFFFFF");
  box(g, [4.9, 0.3, 4.6], [-5.2, 2.4, -0.4], "#6FA8FF");
  box(g, [3.0, 0.6, 1.4], [-5.2, 2.6, -4.6], "#F4ECD8");
  box(g, [5.0, 3.6, 0.4], [-5.2, 1.8, -5.6], "#8A5A33");
  // nightstand + clock
  box(g, [2.0, 2.4, 1.8], [-1.6, 1.2, -4.6], "#7A5230");
  sign(g, f, { text: "7:00", w: 1.4, h: 0.6, fg: "#FF3B30", bg: "#111111" }, [-1.6, 2.85, -3.68], { id: "sign:clock", backing: "#24304F", depth: 0.5 });
  // standing mirror (right)
  box(g, [3.2, 6.4, 0.3], [4.0, 3.6, -4.8], "#FFFFFF");
  box(g, [2.6, 5.8, 0.05], [4.0, 3.6, -4.62], mat("#DDEBFF", { rough: 0.15, metal: 0.2 }), { cast: false });
  box(g, [1.6, 0.4, 1.2], [4.0, 0.2, -4.8], "#FFFFFF");
  return {
    group: g, interior: true, texts: ["SPACE CAMP", "MILO", "7:00"],
    marks: { ...STANDARD_MARKS, bedEdge: { pos: [-3.6, 0, -0.2], yaw: 70, seatTop: 2.3 }, mirror: { pos: [4.0, 0, 2.5], yaw: 180 }, mirrorFront: { pos: [4.0, 0, -1.2], yaw: 0 }, doorway: { pos: [6.6, 0, -2.6], yaw: -40 } },
    focus: {},
  };
}
