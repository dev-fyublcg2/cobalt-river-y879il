import React from "react";
import { Composition } from "remotion";
import { TestShot } from "./scenes/TestShot";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TestShot" component={TestShot} width={1080} height={1920} fps={60} durationInFrames={60} />
  </>
);
