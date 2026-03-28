import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Mesh } from "three";
import { createFresnelGlowMaterial } from "~/shaders/fresnelGlow";

interface ChainLinkProps {
  position: [number, number, number];
  rotation: [number, number, number];
  visible: boolean;
  index: number;
  intensityOverride?: number;
}

export default function ChainLink({
  position,
  rotation,
  visible,
  index,
  intensityOverride,
}: ChainLinkProps) {
  const meshRef = useRef<Mesh>(null);
  const { colorNode, uniforms } = useMemo(() => createFresnelGlowMaterial(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current || !visible) return;
    uniforms.uTime.value = clock.getElapsedTime() + index * 0.5;

    if (intensityOverride !== undefined) {
      uniforms.uIntensity.value = intensityOverride;
      uniforms.uPulseSpeed.value = 8.0; // Faster pulse when completing
    } else {
      uniforms.uIntensity.value = 1.0;
      uniforms.uPulseSpeed.value = 2.0;
    }

    // Slow rotation
    meshRef.current.rotation.x += 0.005;
    meshRef.current.rotation.y += 0.008;
  });

  if (!visible) return null;

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <torusGeometry args={[0.4, 0.08, 16, 32]} />
      <meshStandardNodeMaterial colorNode={colorNode} transparent />
    </mesh>
  );
}
