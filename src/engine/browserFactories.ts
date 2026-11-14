// Browser-side canvas textures for world text + cloth patterns. Fonts come from /assets/fonts (bundled, no CDN).
import * as THREE from "three";
import type { Factories, PatternSpec, TextSpec } from "../../assets/sets/common";

const PX = 160; // texels per world unit
export const browserFactories: Factories = {
  text: (s: TextSpec) => {
    const c = document.createElement("canvas");
    c.width = Math.max(32, Math.round(s.w * PX)); c.height = Math.max(32, Math.round(s.h * PX));
    const g = c.getContext("2d")!;
    g.fillStyle = s.bg ?? "#FFFFFF"; g.fillRect(0, 0, c.width, c.height);
    if (s.border) { g.strokeStyle = s.border; g.lineWidth = Math.min(c.width, c.height) * 0.06; g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, c.width - g.lineWidth, c.height - g.lineWidth); }
    const lines = s.lines ?? [s.text];
    const fam = s.font === "hand" ? "Anton" : "Luckiest Guy";
    let size = (c.height / lines.length) * 0.72;
    g.font = `${size}px "${fam}"`;
    const widest = Math.max(...lines.map((l) => g.measureText(l).width));
    if (widest > c.width * 0.88) size *= (c.width * 0.88) / widest;
    g.font = `${size}px "${fam}"`;
    g.fillStyle = s.fg ?? "#111111"; g.textAlign = "center"; g.textBaseline = "middle";
    const lh = c.height / lines.length;
    lines.forEach((l, i) => g.fillText(l, c.width / 2, lh * (i + 0.5) + size * 0.06));
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 });
  },
  pattern: (s: PatternSpec) => {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const [a, b, d] = [s.colors[0], s.colors[1] ?? s.colors[0], s.colors[2] ?? s.colors[1] ?? s.colors[0]];
    g.fillStyle = a; g.fillRect(0, 0, 128, 128);
    if (s.kind === "stripes") { g.fillStyle = b; for (let y = 8; y < 128; y += 32) g.fillRect(0, y, 128, 12); g.fillStyle = d; for (let y = 22; y < 128; y += 32) g.fillRect(0, y, 128, 3); }
    if (s.kind === "plaid") { g.globalAlpha = 0.6; g.fillStyle = b; for (let k = 0; k < 128; k += 32) { g.fillRect(k, 0, 12, 128); g.fillRect(0, k, 128, 12); } g.fillStyle = d; for (let k = 20; k < 128; k += 32) { g.fillRect(k, 0, 3, 128); g.fillRect(0, k, 128, 3); } g.globalAlpha = 1; }
    if (s.kind === "dots") { g.fillStyle = b; for (let y = 12; y < 128; y += 28) for (let x = (y / 28) % 2 ? 26 : 12; x < 128; x += 28) { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); } }
    if (s.kind === "solid") { g.fillStyle = b; g.fillRect(0, 112, 128, 16); }
    if (s.kind === "suit") { g.fillStyle = d; g.beginPath(); g.moveTo(44, 0); g.lineTo(64, 60); g.lineTo(84, 0); g.fill(); g.fillStyle = b; g.fillRect(58, 4, 12, 90); }
    if (s.kind === "coat") { g.fillStyle = b; g.beginPath(); g.moveTo(48, 0); g.lineTo(64, 50); g.lineTo(80, 0); g.fill(); g.fillStyle = d; g.fillRect(62, 50, 4, 78); }
    if (s.kind === "track") { g.fillStyle = b; g.fillRect(0, 0, 14, 128); g.fillRect(114, 0, 14, 128); g.fillStyle = d; g.fillRect(0, 108, 128, 20); }
    if (s.kind === "apron") { g.fillStyle = b; g.fillRect(0, 0, 128, 128); g.fillStyle = a; g.fillRect(28, 24, 72, 104); g.fillStyle = d; g.fillRect(40, 70, 48, 20); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 });
  },
};
