import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import AtmosphericSky from "~/screens/home/scene/AtmosphericSky";
import Environment from "~/components/three/environment/Environment";
import SectionManager from "~/screens/home/scene/SectionManager";
import HeroWorld from "~/screens/home/scene/HeroWorld";
import IdentityWorld from "~/screens/home/scene/IdentityWorld";
import TeaserWorld from "~/screens/home/scene/TeaserWorld";
import ValueWorld from "~/screens/home/scene/ValueWorld";
import type { ScrollPinnedState } from "~/hooks/useScrollPinned";
import NativePostProcessing from "./NativePostProcessing";
import WebGPUCanvas from "~/components/three/canvas/WebGPUCanvas.client";

interface HomeSceneProps {
  scrollState: React.RefObject<ScrollPinnedState>;
  onReady?: () => void;
}

/** Fires onReady after a few frames render (ensures scene is actually visible) */
function ReadyNotifier({ onReady }: { onReady?: () => void }) {
  const frameCount = useRef(0);
  useFrame(() => {
    if (frameCount.current < 0) return; // already fired
    frameCount.current++;
    // Wait 5 frames to ensure shaders are compiled and scene is visible
    if (frameCount.current >= 5 && onReady) {
      frameCount.current = -1;
      onReady();
    }
  });
  return null;
}

export default function HomeScene({ scrollState, onReady }: HomeSceneProps) {
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
      <ReadyNotifier onReady={onReady} />
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
