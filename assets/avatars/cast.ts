// Cast sheet: every character is the same 6-part rig with different scale, colours and cloth patterns.
import type { PatternSpec } from "../sets/common";

export type CharacterSpec = {
  id: string;
  label: string;
  scale: number;          // overall body scale (adult = 1)
  headScale: number;      // extra head scale (kids read younger with bigger heads)
  skin: string;
  shirt: PatternSpec;
  sleeves: "short" | "long";
  pants: PatternSpec;
  hair?: { color: string; style: "cap" | "long" | "bun" | "pigtails" };
  wrist: string;          // default wrist number (shots may override)
};

const SKIN = "#F2C48D";
const SKIN2 = "#E0A878";
const SKIN3 = "#C98E5F";

export const CAST: Record<string, CharacterSpec> = {
  milo:   { id: "milo", label: "Milo (11, narrator)", scale: 0.86, headScale: 1.06, skin: SKIN, sleeves: "short",
            shirt: { kind: "stripes", colors: ["#FFD400", "#111111", "#FFFFFF"] }, pants: { kind: "solid", colors: ["#2F5D9E", "#24497C"] },
            hair: { color: "#5A3A22", style: "cap" }, wrist: "4,015" },
  june:   { id: "june", label: "June (4)", scale: 0.64, headScale: 1.2, skin: SKIN, sleeves: "short",
            shirt: { kind: "dots", colors: ["#FF8FB1", "#FFFFFF", "#E8648C"] }, pants: { kind: "solid", colors: ["#FF8FB1", "#E8648C"] },
            hair: { color: "#E0A030", style: "pigtails" }, wrist: "4" },
  mom:    { id: "mom", label: "Mom", scale: 1, headScale: 1, skin: SKIN, sleeves: "long",
            shirt: { kind: "stripes", colors: ["#3FA7A0", "#2C7F79", "#FFFFFF"] }, pants: { kind: "solid", colors: ["#4A4E52", "#3A3D40"] },
            hair: { color: "#3A2A1A", style: "long" }, wrist: "9" },
  dad:    { id: "dad", label: "Dad", scale: 1, headScale: 1, skin: SKIN, sleeves: "long",
            shirt: { kind: "plaid", colors: ["#6E8B3D", "#4E6A28", "#F4ECD8"] }, pants: { kind: "solid", colors: ["#2B3A55", "#223047"] },
            hair: { color: "#2A2A2A", style: "cap" }, wrist: "6" },
  doctor: { id: "doctor", label: "Doctor", scale: 1, headScale: 1, skin: SKIN3, sleeves: "long",
            shirt: { kind: "coat", colors: ["#FFFFFF", "#7EC8F0", "#D8DEE4"] }, pants: { kind: "solid", colors: ["#4A4E52", "#3A3D40"] },
            hair: { color: "#1E1E1E", style: "cap" }, wrist: "10,950" },
  clerk:  { id: "clerk", label: "Ms. Gray, town clerk", scale: 1, headScale: 1, skin: SKIN2, sleeves: "long",
            shirt: { kind: "stripes", colors: ["#8E5BA8", "#6F4386", "#F4ECD8"] }, pants: { kind: "solid", colors: ["#3A3A3A", "#2C2C2C"] },
            hair: { color: "#BBBBBB", style: "bun" }, wrist: "14,600" },
  uncle:  { id: "uncle", label: "Uncle (before)", scale: 1, headScale: 1, skin: SKIN, sleeves: "long",
            shirt: { kind: "suit", colors: ["#5B6F8A", "#B5523B", "#FFFFFF"] }, pants: { kind: "solid", colors: ["#5B6F8A", "#4A5C74"] },
            hair: { color: "#3B2B1B", style: "cap" }, wrist: "21,900" },
  uncleOld: { id: "uncleOld", label: "Uncle (now boss, 71)", scale: 1, headScale: 1, skin: SKIN, sleeves: "long",
            shirt: { kind: "suit", colors: ["#111111", "#FFD400", "#FFFFFF"] }, pants: { kind: "solid", colors: ["#1E1E1E", "#111111"] },
            hair: { color: "#E6E6E6", style: "cap" }, wrist: "3,650" },
  boss:   { id: "boss", label: "Boss", scale: 1, headScale: 1, skin: SKIN2, sleeves: "long",
            shirt: { kind: "suit", colors: ["#2A2A2A", "#5FA83F", "#FFFFFF"] }, pants: { kind: "solid", colors: ["#2A2A2A", "#1E1E1E"] },
            wrist: "9,030" },
  cousin: { id: "cousin", label: "Cousin", scale: 0.95, headScale: 1, skin: SKIN, sleeves: "short",
            shirt: { kind: "stripes", colors: ["#B5523B", "#F4ECD8", "#8C3B28"] }, pants: { kind: "solid", colors: ["#2F5D9E", "#24497C"] },
            hair: { color: "#7A3E1F", style: "long" }, wrist: "18,250" },
  ex:     { id: "ex", label: "Cousin's ex", scale: 0.97, headScale: 1, skin: SKIN3, sleeves: "long",
            shirt: { kind: "solid", colors: ["#9AA3AD", "#7E8790"] }, pants: { kind: "solid", colors: ["#4A4E52", "#3A3D40"] },
            hair: { color: "#111111", style: "cap" }, wrist: "16,001" },
  coach:  { id: "coach", label: "Coach (gym teacher)", scale: 1.02, headScale: 1, skin: SKIN2, sleeves: "short",
            shirt: { kind: "track", colors: ["#2F8F4F", "#FFFFFF", "#246F3D"] }, pants: { kind: "track", colors: ["#2F8F4F", "#FFFFFF", "#246F3D"] },
            wrist: "8,760" },
  stranger: { id: "stranger", label: "Stranger", scale: 1, headScale: 1, skin: SKIN, sleeves: "short",
            shirt: { kind: "solid", colors: ["#E07A2F", "#B85F1E"] }, pants: { kind: "solid", colors: ["#4A4E52", "#3A3D40"] },
            hair: { color: "#C9A227", style: "cap" }, wrist: "13,505" },
  lunchLady: { id: "lunchLady", label: "Lunch lady", scale: 1, headScale: 1, skin: SKIN3, sleeves: "short",
            shirt: { kind: "apron", colors: ["#FFFFFF", "#B5523B", "#E4E4E4"] }, pants: { kind: "solid", colors: ["#B5523B", "#8C3B28"] },
            hair: { color: "#FFFFFF", style: "cap" }, wrist: "11,111" },
  kid1:   { id: "kid1", label: "Classmate A", scale: 0.84, headScale: 1.06, skin: SKIN3, sleeves: "short",
            shirt: { kind: "stripes", colors: ["#6FA8FF", "#FFFFFF", "#4C86DD"] }, pants: { kind: "solid", colors: ["#4A4E52", "#3A3D40"] },
            hair: { color: "#111111", style: "cap" }, wrist: "3,980" },
  kid2:   { id: "kid2", label: "Classmate B", scale: 0.82, headScale: 1.06, skin: SKIN, sleeves: "short",
            shirt: { kind: "solid", colors: ["#5FA83F", "#4C8A31"] }, pants: { kind: "solid", colors: ["#2B3A55", "#223047"] },
            hair: { color: "#B5523B", style: "pigtails" }, wrist: "3,712" },
  t1:     { id: "t1", label: "Townsperson 1", scale: 1, headScale: 1, skin: SKIN, sleeves: "long",
            shirt: { kind: "plaid", colors: ["#B5523B", "#8C3B28", "#F4ECD8"] }, pants: { kind: "solid", colors: ["#2B3A55", "#223047"] },
            hair: { color: "#2A2A2A", style: "cap" }, wrist: "12,045" },
  t2:     { id: "t2", label: "Townsperson 2", scale: 0.97, headScale: 1, skin: SKIN2, sleeves: "short",
            shirt: { kind: "solid", colors: ["#FFD9A0", "#E8B878"] }, pants: { kind: "solid", colors: ["#4A4E52", "#3A3D40"] },
            hair: { color: "#5A3A22", style: "long" }, wrist: "8,311" },
  t3:     { id: "t3", label: "Townsperson 3", scale: 1.03, headScale: 1, skin: SKIN3, sleeves: "long",
            shirt: { kind: "stripes", colors: ["#6E8B3D", "#FFFFFF", "#4E6A28"] }, pants: { kind: "solid", colors: ["#9A6B3F", "#7A5230"] },
            wrist: "19,402" },
  t4:     { id: "t4", label: "Townsperson 4", scale: 0.95, headScale: 1, skin: SKIN, sleeves: "short",
            shirt: { kind: "dots", colors: ["#8E5BA8", "#FFFFFF", "#6F4386"] }, pants: { kind: "solid", colors: ["#2F5D9E", "#24497C"] },
            hair: { color: "#C9A227", style: "bun" }, wrist: "6,170" },
};
