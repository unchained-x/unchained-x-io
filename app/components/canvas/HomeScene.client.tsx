import { useMemo } from "react";
import AtmosphericSky from "~/components/canvas/AtmosphericSky";
import Environment from "~/components/canvas/Environment";
import SectionManager from "~/components/canvas/SectionManager";
import HeroWorld from "~/components/sections/HeroWorld";
import IdentityWorld from "~/components/sections/IdentityWorld";
import TeaserWorld from "~/components/sections/TeaserWorld";
import ValueWorld from "~/components/sections/ValueWorld";
import type { SectionProgress } from "~/hooks/useScrollScene";
import NativePostProcessing from "./NativePostProcessing";
import WebGPUCanvas from "./WebGPUCanvas.client";

interface HomeSceneProps {
  scrollProgress: SectionProgress;
}

const SECTION_BOUNDARIES = [0.25, 0.5, 0.75];

export default function HomeScene({ scrollProgress }: HomeSceneProps) {
  const totalProgress = scrollProgress.totalProgress;

  // Transition intensity for post-process shader
  let minDist = 1;
  for (const b of SECTION_BOUNDARIES) {
    const d = Math.abs(totalProgress - b);
    if (d < minDist) minDist = d;
  }
  const transitionZone = 0.08;
  const transitionIntensity = minDist < transitionZone ? (1 - minDist / transitionZone) ** 2 : 0;

  // Stable section renderers
  const sections = useMemo(
    () => [
      (vis: number) => <HeroWorld visibility={vis} />,
      (vis: number) => <TeaserWorld visibility={vis} />,
      (vis: number) => <IdentityWorld visibility={vis} />,
      (vis: number) => <ValueWorld visibility={vis} />,
    ],
    [],
  );

  return (
    <WebGPUCanvas className="!fixed inset-0 z-0" dpr={[1, 2]}>
      <AtmosphericSky />
      <Environment />
      <fog attach="fog" args={["#0f0825", 15, 50]} />

      <SectionManager
        progress={totalProgress}
        sections={sections}
        boundaries={SECTION_BOUNDARIES}
      />

      <NativePostProcessing
        bloomStrength={1.2}
        bloomRadius={0.4}
        toneMappingExposure={1.0}
        transitionIntensity={transitionIntensity}
      />
    </WebGPUCanvas>
  );
}
