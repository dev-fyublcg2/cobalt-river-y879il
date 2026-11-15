import React from "react";
import { Composition } from "remotion";
import shotlist from "../spec/shotlist.json";
import { TestShot } from "./scenes/TestShot";
import { Shot } from "./scenes/Shot";
import style from "../spec/style.json";

/** samples k = 0..n-1 at t = k / animFps, clamped so the last sample lands exactly on the shot end */
export const animSamples = (dur: number) => Math.ceil(dur * style.render.animFps - 1e-9) + 1;

// One composition per shot (shot-S001 ...), each rendering the data-driven <Shot/> for that id.
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TestShot" component={TestShot} width={1080} height={1920} fps={60} durationInFrames={60} />
    {shotlist.shots.map((s) => (
      <Composition key={s.id} id={`shot-${s.id}`} component={Shot as any} width={shotlist.width} height={shotlist.height} fps={shotlist.fps} durationInFrames={s.frames} defaultProps={{ shotId: s.id, still: true }} />
    ))}
    {/* animated pass: per-shot 3D samples at render.animFps (own samples incl. the shot endpoint), full 1080x1920, lens fixed at
        zoomFrom; assembly blends the samples to 60 fps inside the shot and applies the 60 fps push-in (tools/render/render-anim.ts) */}
    {shotlist.shots.map((s) => (
      <Composition key={`a${s.id}`} id={`anim-${s.id}`} component={Shot as any} width={shotlist.width} height={shotlist.height} fps={style.render.animFps} durationInFrames={animSamples(s.dur)} defaultProps={{ shotId: s.id, still: false, anim: true }} />
    ))}
  </>
);
