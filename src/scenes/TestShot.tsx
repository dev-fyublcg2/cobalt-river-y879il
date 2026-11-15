import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";

export const TestShot: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#7EC8F0" }}>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 30, position: [0, 2, 12] }}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 6, 5]} intensity={2} color="#FFD9A0" />
        <mesh rotation={[0.3, frame * 0.02, 0]} position={[0, 2, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#F2C48D" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#5FA83F" />
        </mesh>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
