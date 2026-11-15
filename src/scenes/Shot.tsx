// One data-driven shot component: renders any shot from /spec/shotlist.json (instantiated once per shot id).
// Deterministic: time = frame / fps; no clocks, no randomness, no network.
import React, { useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useDelayRender, useVideoConfig, staticFile } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import shotlist from "../../spec/shotlist.json";
import styleJson from "../../spec/style.json";
import { buildShotScene, makeCamera, type Shot as ShotT } from "../engine/shot";
import { browserFactories } from "../engine/browserFactories";
import { cubicBezier } from "../engine/math";

const faceUrls: Record<string, string> = Object.fromEntries(
  styleJson.faces.expressions.map((e) => [e, staticFile(`assets/faces/${e}.png`)]),
);
const ease = cubicBezier(...(styleJson.camera.pushEase as [number, number, number, number]));

function useAssets() {
  const { delayRender, continueRender } = useDelayRender();
  const [state, setState] = useState<{ faces: Record<string, THREE.Texture> } | null>(null);
  const [handle] = useState(() => delayRender("fonts + faces"));
  useEffect(() => {
    (async () => {
      const fonts = [new FontFace("Anton", `url(${staticFile("assets/fonts/Anton-Regular.ttf")})`), new FontFace("Luckiest Guy", `url(${staticFile("assets/fonts/LuckiestGuy-Regular.ttf")})`)];
      for (const f of fonts) { await f.load(); document.fonts.add(f); }
      const loader = new THREE.TextureLoader();
      const faces: Record<string, THREE.Texture> = {};
      await Promise.all(Object.entries(faceUrls).map(async ([k, u]) => { const t = await loader.loadAsync(u); t.colorSpace = THREE.SRGBColorSpace; faces[k] = t; }));
      setState({ faces });
      continueRender(handle);
    })();
  }, []);
  return state;
}

const Stage: React.FC<{ shot: ShotT; faces: Record<string, THREE.Texture>; zoom: number; t: number }> = ({ shot, faces, zoom, t }) => {
  const { gl } = useThree();
  const built = useMemo(() => buildShotScene(shot, browserFactories, (e) => faces[e] ?? null, "browser"), [shot.id]);
  const m = styleJson.lighting.moods[shot.mood];
  useMemo(() => {
    // gradient sky dome (vertex colours, unlit): bg[0] at zenith -> bg[1] at the horizon
    const g = new THREE.SphereGeometry(450, 32, 16);
    const top = new THREE.Color(m.bg[0]), hor = new THREE.Color(m.bg[1]);
    const pos = g.attributes.position; const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const k = Math.min(1, Math.max(0, pos.getY(i) / 450 / 0.45));
      const c = hor.clone().lerp(top, Math.pow(k, 0.7)); col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const dome = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
    dome.name = "skyDome";
    built.scene.add(dome);
    built.scene.background = new THREE.Color(m.bg[1]);
  }, [shot.id]);
  built.update(t);
  gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFShadowMap; gl.toneMapping = THREE.NoToneMapping;
  return <primitive object={built.scene} />;
};

export const Shot: React.FC<{ shotId: string; still?: boolean; anim?: boolean }> = ({ shotId, still, anim }) => {
  const frame = useCurrentFrame();
  const assets = useAssets();
  const shot = (shotlist.shots as unknown as ShotT[]).find((s) => s.id === shotId)!;
  const { width, height, fps } = useVideoConfig();
  const t = Math.min(shot.dur, frame / fps); // time comes from the frame only
  // stills and the animated pass keep the lens at zoomFrom; the push-in is applied at 60 fps in assembly
  const zoom = still || anim ? shot.camera.zoomFrom : shot.camera.zoomFrom + (shot.camera.zoomTo - shot.camera.zoomFrom) * ease(Math.min(1, t / shot.dur));
  return (
    <AbsoluteFill style={{ background: "#111111" }}>
      {assets ? (
        <ThreeCanvas width={width} height={height} dpr={1} gl={{ antialias: true, preserveDrawingBuffer: true }} shadows camera={makeCamera(shot.camera, zoom) as any}>
          <Stage shot={shot} faces={assets.faces} zoom={zoom} t={t} />
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};
