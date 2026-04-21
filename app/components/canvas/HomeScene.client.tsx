import { useMemo, useRef } from "react";
import type { Group } from "three";
import AtmosphericSky from "~/components/canvas/AtmosphericSky";
import Environment from "~/components/canvas/Environment";
import SectionManager from "~/components/canvas/SectionManager";
import HeroWorld from "~/components/sections/HeroWorld";
import IdentityWorld from "~/components/sections/IdentityWorld";
import TeaserWorld from "~/components/sections/TeaserWorld";
import ValueWorld from "~/components/sections/ValueWorld";
import type { ScrollPinnedState } from "~/hooks/useScrollPinned";
import NativePostProcessing from "./NativePostProcessing";
import WebGPUCanvas from "./WebGPUCanvas.client";

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

  return (
    <WebGPUCanvas className="!fixed inset-0 z-0" dpr={[1, 1.5]}>
      <AtmosphericSky />
      <Environment />
      <fog attach="fog" args={["#0f0825", 15, 50]} />

      <SectionManager
        sections={sections}
        groupsRef={sectionGroupsRef}
        scrollState={scrollState}
      />

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
