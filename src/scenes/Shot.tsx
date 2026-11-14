// One data-driven shot component: renders any shot from /spec/shotlist.json (instantiated once per shot id).
// Deterministic: time = frame / fps; no clocks, no randomness, no network.
import React, { useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useDelayRender, staticFile } from "remotion";
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
    const c = document.createElement("canvas"); c.width = 4; c.height = 256;
    const g = c.getContext("2d")!; const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, m.bg[0]); gr.addColorStop(1, m.bg[1]); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    built.scene.background = new THREE.Color(m.bg[0]); void tex;
  }, [shot.id]);
  built.update(t);
  gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFShadowMap; gl.toneMapping = THREE.NoToneMapping;
  return <primitive object={built.scene} />;
};

export const Shot: React.FC<{ shotId: string; still?: boolean }> = ({ shotId, still }) => {
  const frame = useCurrentFrame();
  const assets = useAssets();
  const shot = (shotlist.shots as unknown as ShotT[]).find((s) => s.id === shotId)!;
  const t = frame / shotlist.fps;
  const zoom = still ? shot.camera.zoomFrom : shot.camera.zoomFrom + (shot.camera.zoomTo - shot.camera.zoomFrom) * ease(t / shot.dur);
  return (
    <AbsoluteFill style={{ background: "#111111" }}>
      {assets ? (
        <ThreeCanvas width={shotlist.width} height={shotlist.height} dpr={1} gl={{ antialias: true, preserveDrawingBuffer: true }} shadows camera={makeCamera(shot.camera, zoom) as any}>
          <Stage shot={shot} faces={assets.faces} zoom={zoom} t={t} />
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};
