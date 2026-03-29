import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import GlitchText from "~/components/canvas/GlitchText";
import ChainBridge from "~/components/canvas/organisms/ChainBridge";
import LivingObject from "~/components/canvas/organisms/LivingObject";

interface IdentitySceneProps {
  progress: number;
}

export default function IdentityScene({ progress }: IdentitySceneProps) {
  const groupRef = useRef<Group>(null);

  const visible = progress > 0.02;
  const fadeIn = Math.min(1, progress * 3);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // Camera-like drift
    groupRef.current.rotation.y = Math.sin(t * 0.1) * 0.04;

    // Objects morph/reconfigure — pulsing scale
    const breathe = Math.sin(t * 0.5) * 0.05 + 1;
    groupRef.current.scale.set(breathe * fadeIn, breathe * fadeIn, breathe * fadeIn);
  });

  if (!visible) return null;

  // Objects reconfigure into a structured arrangement
  const leftObj: [number, number, number] = [-3.5, 0, 0];
  const rightObj: [number, number, number] = [3.5, 0, 0];
  const topObj: [number, number, number] = [0, 2.5, 0];
  const bottomObj: [number, number, number] = [0, -2.5, 0];

  return (
    <group ref={groupRef} position={[0, 0, -20]}>
      {/* Objects in structured formation */}
      <LivingObject type="blob" position={leftObj} scale={0.7} noiseAmplitude={0.25} index={30} />
      <LivingObject type="blob" position={rightObj} scale={0.7} noiseAmplitude={0.25} index={31} />
      <LivingObject type="crystal" position={topObj} scale={0.5} noiseAmplitude={0.1} index={32} />
      <LivingObject type="gear" position={bottomObj} scale={0.5} noiseAmplitude={0.12} index={33} />

      {/* Chains connecting them — network formation */}
      <ChainBridge from={leftObj} to={topObj} linkCount={5} />
      <ChainBridge from={topObj} to={rightObj} linkCount={5} />
      <ChainBridge from={rightObj} to={bottomObj} linkCount={5} />
      <ChainBridge from={bottomObj} to={leftObj} linkCount={5} />

      {/* Identity text */}
      <group position={[0, 1.0, 1.5]}>
        <GlitchText size={0.2} glitchIntensity={0.8} depth={0.025}>
          Who We Are
        </GlitchText>
      </group>

      <group position={[0, 0.3, 1.5]}>
        <GlitchText size={0.065} glitchIntensity={0.12} depth={0.006}>
          A creative venture studio experimenting
        </GlitchText>
      </group>
      <group position={[0, -0.1, 1.5]}>
        <GlitchText size={0.065} glitchIntensity={0.12} depth={0.006}>
          at the intersection of technology and creativity.
        </GlitchText>
      </group>

      {/* Value text */}
      <group position={[0, -1.2, 1.5]}>
        <GlitchText size={0.2} glitchIntensity={0.8} depth={0.025}>
          What We Deliver
        </GlitchText>
      </group>

      <group position={[0, -1.9, 1.5]}>
        <GlitchText size={0.065} glitchIntensity={0.12} depth={0.006}>
          We design and expand value, networks,
        </GlitchText>
      </group>
      <group position={[0, -2.3, 1.5]}>
        <GlitchText size={0.065} glitchIntensity={0.12} depth={0.006}>
          and human potential.
        </GlitchText>
      </group>
    </group>
  );
}
