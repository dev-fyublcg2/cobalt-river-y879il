import React from "react";
import { Composition } from "remotion";
import shotlist from "../spec/shotlist.json";
import { TestShot } from "./scenes/TestShot";
import { Shot } from "./scenes/Shot";

// One composition per shot (shot-S001 ...), each rendering the data-driven <Shot/> for that id.
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TestShot" component={TestShot} width={1080} height={1920} fps={60} durationInFrames={60} />
    {shotlist.shots.map((s) => (
      <Composition key={s.id} id={`shot-${s.id}`} component={Shot as any} width={shotlist.width} height={shotlist.height} fps={shotlist.fps} durationInFrames={s.frames} defaultProps={{ shotId: s.id, still: true }} />
    ))}
  </>
);
