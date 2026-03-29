import AtmosphericParticles from "~/components/canvas/AtmosphericParticles";
import AtmosphericSky from "~/components/canvas/AtmosphericSky";
import BackgroundCity from "~/components/canvas/BackgroundCity";
import Environment from "~/components/canvas/Environment";
import Ground from "~/components/canvas/Ground";
import NeonClouds from "~/components/canvas/NeonClouds";
import HeroScene from "~/components/sections/HeroScene";
import IdentityScene from "~/components/sections/IdentityScene";
import TeaserScene from "~/components/sections/TeaserScene";
import type { SectionProgress } from "~/hooks/useScrollScene";
import NativePostProcessing from "./NativePostProcessing";
import WebGPUCanvas from "./WebGPUCanvas.client";

interface HomeSceneProps {
  scrollProgress: SectionProgress;
}

export default function HomeScene({ scrollProgress }: HomeSceneProps) {
  const heroProgress = scrollProgress.activeSection === 0 ? scrollProgress.sectionProgress : 1;
  const teaserProgress =
    scrollProgress.activeSection === 1
      ? scrollProgress.sectionProgress
      : scrollProgress.activeSection > 1
        ? 1
        : 0;
  const identityProgress =
    scrollProgress.activeSection === 2
      ? scrollProgress.sectionProgress
      : scrollProgress.activeSection > 2
        ? 1
        : 0;

  return (
    <WebGPUCanvas className="!fixed inset-0 z-0" dpr={[1, 2]}>
      {/* === Sky + Environment === */}
      <AtmosphericSky />
      <Environment />
      <fog attach="fog" args={["#0f0825", 15, 50]} />

      {/* === Lighting — neon cyberpunk rig === */}
      <ambientLight intensity={0.05} />
      {/* Key: overhead cyan */}
      <pointLight position={[0, 8, 2]} intensity={4} color="#00F0FF" distance={40} decay={2} />
      {/* Fill: purple from side */}
      <pointLight position={[-8, 4, 4]} intensity={3} color="#BF00FF" distance={30} decay={2} />
      {/* Rim: warm accent from behind */}
      <pointLight position={[6, 3, -8]} intensity={2} color="#FF4500" distance={25} decay={2} />
      {/* Ground bounce: subtle cyan from below */}
      <pointLight position={[0, -1, 0]} intensity={1.5} color="#00F0FF" distance={15} decay={2} />
      {/* Far neon signs feel */}
      <pointLight position={[-12, 6, -10]} intensity={2} color="#FF1493" distance={30} decay={2} />
      <pointLight position={[10, 5, -12]} intensity={2} color="#00FF88" distance={25} decay={2} />

      {/* === Ground === */}
      <Ground
        size={120}
        yPos={-3}
        texture="speedway_tiles"
        repeat={[12, 12]}
        envMapIntensity={0.4}
      />

      {/* === Cyberpunk city background === */}
      <BackgroundCity position={[0, -3, -5]} scale={0.45} rotation={[0, 0.2, 0]} />

      {/* === Neon smoke/clouds === */}
      <NeonClouds />

      {/* === Atmospheric particles — centered around camera area === */}
      <group position={[0, 0, 5]}>
        <AtmosphericParticles
          count={150}
          color="#00F0FF"
          size={0.015}
          speed={0.08}
          area={[20, 12, 20]}
        />
        <AtmosphericParticles
          count={80}
          color="#BF00FF"
          size={0.012}
          speed={0.06}
          area={[15, 10, 15]}
        />
        <AtmosphericParticles
          count={50}
          color="#FF4500"
          size={0.01}
          speed={0.04}
          area={[12, 8, 12]}
        />
      </group>

      {/* === Scenes === */}
      <HeroScene progress={heroProgress} />
      <TeaserScene progress={teaserProgress} />
      <IdentityScene progress={identityProgress} />

      {/* === Post-processing === */}
      <NativePostProcessing bloomStrength={1.2} bloomRadius={0.4} toneMappingExposure={1.0} />
    </WebGPUCanvas>
  );
}
