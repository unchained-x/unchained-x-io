import { useMemo, useRef } from "react";
import type { Group } from "three";
import WebGPUCanvas from "~/components/three/canvas/WebGPUCanvas.client";
import Environment from "~/components/three/environment/Environment";
import type { ScrollPinnedState } from "~/hooks/useScrollPinned";
import AtmosphericSky from "~/screens/home/scene/AtmosphericSky";
import HeroWorld from "~/screens/home/scene/HeroWorld";
import IdentityWorld from "~/screens/home/scene/IdentityWorld";
import SectionManager from "~/screens/home/scene/SectionManager";
import TeaserWorld from "~/screens/home/scene/TeaserWorld";
import ValueWorld from "~/screens/home/scene/ValueWorld";
import NativePostProcessing from "./NativePostProcessing";

interface HomeSceneProps {
  scrollState: React.RefObject<ScrollPinnedState>;
}

export default function HomeScene({ scrollState }: HomeSceneProps) {
  const sectionGroupsRef = useRef<(Group | null)[]>([]);

  const sections = useMemo(
    () => [
      <HeroWorld key="hero" visibility={1} />,
      <TeaserWorld key="teaser" visibility={1} />,
      <IdentityWorld key="identity" visibility={1} />,
      <ValueWorld key="value" visibility={1} />,
    ],
    [],
  );

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <WebGPUCanvas className="!fixed inset-0 z-0" dpr={isMobile ? [1, 1] : [1, 1.5]}>
      <AtmosphericSky />
      <Environment />
      <fog attach="fog" args={["#0f0825", 15, 50]} />

      <SectionManager sections={sections} groupsRef={sectionGroupsRef} scrollState={scrollState} />

      <NativePostProcessing
        bloomStrength={1.2}
        bloomRadius={0.4}
        toneMappingExposure={1.0}
        sectionGroups={sectionGroupsRef}
        scrollState={scrollState}
      />
    </WebGPUCanvas>
  );
}
