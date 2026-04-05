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

// Hero: 0-0.2, Teaser: 0.2-0.45, Identity: 0.45-0.7, Value: 0.7-1.0
const SECTION_BOUNDARIES = [0.2, 0.45, 0.7];

export default function HomeScene({ scrollProgress }: HomeSceneProps) {
  const totalProgress = scrollProgress.totalProgress;

  // Transition intensity — only near section boundaries
  let minDist = 1;
  for (const b of SECTION_BOUNDARIES) {
    const d = Math.abs(totalProgress - b);
    if (d < minDist) minDist = d;
  }

  const transitionZone = 0.06;
  const transitionIntensity = minDist < transitionZone ? (1 - minDist / transitionZone) ** 2 : 0;

  // Active section
  let activeSection = 0;
  if (totalProgress >= SECTION_BOUNDARIES[2]) activeSection = 3;
  else if (totalProgress >= SECTION_BOUNDARIES[1]) activeSection = 2;
  else if (totalProgress >= SECTION_BOUNDARIES[0]) activeSection = 1;

  return (
    <WebGPUCanvas className="!fixed inset-0 z-0" dpr={[1, 2]}>
      <AtmosphericSky />
      <Environment />
      <fog attach="fog" args={["#0f0825", 15, 50]} />

      <SectionManager
        progress={totalProgress}
        sections={[
          (vis) => <HeroWorld visibility={vis} />,
          (vis) => <TeaserWorld visibility={vis} />,
          (vis) => <IdentityWorld visibility={vis} />,
          (vis) => <ValueWorld visibility={vis} />,
        ]}
        activeOverride={activeSection}
      />

      {/* Post-processing: bloom + transition shader in same pipeline */}
      <NativePostProcessing
        bloomStrength={1.2}
        bloomRadius={0.4}
        toneMappingExposure={1.0}
        transitionIntensity={transitionIntensity}
      />
    </WebGPUCanvas>
  );
}
