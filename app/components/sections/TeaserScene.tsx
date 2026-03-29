import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import GlitchText from "~/components/canvas/GlitchText";
import LivingObject from "~/components/canvas/organisms/LivingObject";

interface TeaserSceneProps {
  progress: number;
}

export default function TeaserScene({ progress }: TeaserSceneProps) {
  const groupRef = useRef<Group>(null);

  const visible = progress > 0.02;
  const fadeIn = Math.min(1, progress * 4);
  const textFade = Math.min(1, Math.max(0, (progress - 0.2) * 3));

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // Objects drift apart as section progresses — chains "breaking"
    groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.03;

    // Scale in
    const s = 0.3 + fadeIn * 0.7;
    groupRef.current.scale.set(s, s, s);
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={[0, 0, -10]}>
      {/* Objects that are "breaking free" — spreading apart */}
      <LivingObject
        type="crystal"
        position={[-3 * fadeIn, 1.5, 0]}
        scale={0.5}
        noiseAmplitude={0.2 + progress * 0.3}
        index={20}
      />
      <LivingObject
        type="blob"
        position={[3 * fadeIn, -1, 0.5]}
        scale={0.6}
        noiseAmplitude={0.15 + progress * 0.2}
        index={21}
      />
      <LivingObject
        type="torus"
        position={[0, 2.5 * fadeIn, -0.5]}
        scale={0.4}
        noiseAmplitude={0.1}
        index={22}
      />

      {/* Text emerges */}
      {textFade > 0 && (
        <>
          <group position={[0, 1.0, 1]}>
            <GlitchText size={0.22} glitchIntensity={0.7} depth={0.03}>
              We break chains.
            </GlitchText>
          </group>

          <group position={[0, 0.2, 1]}>
            <GlitchText size={0.22} glitchIntensity={0.7} depth={0.03}>
              We build futures.
            </GlitchText>
          </group>

          {textFade > 0.5 && (
            <>
              <group position={[0, -1.0, 1]}>
                <GlitchText size={0.08} glitchIntensity={0.15} depth={0.008}>
                  Born from the belief that constraints
                </GlitchText>
              </group>
              <group position={[0, -1.5, 1]}>
                <GlitchText size={0.08} glitchIntensity={0.15} depth={0.008}>
                  are meant to be shattered.
                </GlitchText>
              </group>
            </>
          )}
        </>
      )}
    </group>
  );
}
