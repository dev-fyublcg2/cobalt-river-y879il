// Clinic exam room. Text: CLINIC, DR. PATEL, eye chart.
import * as THREE from "three";
import { box, cyl, room, sign, STANDARD_MARKS, type Factories, type SetBuild } from "./common";

export function build(f: Factories): SetBuild {
  const g = new THREE.Group();
  room(g, { halfW: 10, backZ: 6, height: 12, wall: "#CFE8E4", floor: "#E8EEF0", side: "#B9DDD7" });
  for (let x = -9; x <= 9; x += 2) box(g, [0.05, 0.21, 51], [x, 0, 19.5], "#CBD5D9", { cast: false });
  box(g, [20, 1.4, 0.1], [0, 0.7, -5.92], "#7FBFB5", { cast: false });
  sign(g, f, { text: "CLINIC", w: 5.2, h: 1.4, fg: "#FFFFFF", bg: "#3FA7A0" }, [-3.6, 9.0, -5.92], { id: "sign:clinic" });
  sign(g, f, { text: "E", w: 2.2, h: 3.2, fg: "#111111", bg: "#FFFFFF", lines: ["E", "F P", "T O Z"] }, [4.6, 6.6, -5.92], { id: "sign:eyechart", backing: "#111111" });
  // door with name plate
  box(g, [3.2, 7, 0.2], [-7.4, 3.5, -5.85], "#9A6B3F");
  cyl(g, 0.15, 0.15, 0.2, [-6.2, 3.4, -5.7], "#FFD400", { rotX: Math.PI / 2 });
  sign(g, f, { text: "DR. PATEL", w: 2.6, h: 0.7, fg: "#111111", bg: "#F4ECD8" }, [-7.4, 5.6, -5.72], { id: "sign:door" });
  // exam table
  box(g, [5.4, 0.5, 2.4], [3.2, 2.6, -2.6], "#6FA8FF");
  box(g, [5.4, 0.2, 2.5], [3.2, 2.9, -2.6], "#FFFFFF");
  box(g, [4.6, 2.35, 1.8], [3.2, 1.18, -2.6], "#D8DEE4");
  // cabinet + jar
  box(g, [2.6, 3.4, 1.4], [-3.8, 1.7, -5.1], "#FFFFFF");
  cyl(g, 0.4, 0.4, 0.9, [-3.6, 3.85, -5.1], "#BFE3F5");
  return { group: g, interior: true, texts: ["CLINIC", "DR. PATEL", "EYE CHART"], marks: { ...STANDARD_MARKS, table: { pos: [3.2, 0, -1.0], yaw: -10 } }, focus: {} };
}
