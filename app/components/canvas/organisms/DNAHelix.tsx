import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { createFresnelGlowMaterial } from "~/shaders/fresnelGlow";

interface DNAHelixProps {
  position: [number, number, number];
  nodeCount?: number;
  radius?: number;
  height?: number;
}

export default function DNAHelix({
  position,
  nodeCount = 20,
  radius = 0.6,
  height = 3,
}: DNAHelixProps) {
  const groupRef = useRef<Group>(null);
  const fresnel = useMemo(() => createFresnelGlowMaterial(), []);

  const nodes = useMemo(() => {
    const result: { pos: [number, number, number]; strand: number }[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const t = i / nodeCount;
      const angle = t * Math.PI * 4; // 2 full rotations
      const y = (t - 0.5) * height;

      // Strand A
      result.push({
        pos: [Math.cos(angle) * radius, y, Math.sin(angle) * radius],
        strand: 0,
      });
      // Strand B (offset by PI)
      result.push({
        pos: [Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius],
        strand: 1,
      });
    }
    return result;
  }, [nodeCount, radius, height]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    fresnel.uniforms.uTime.value = t;
    groupRef.current.rotation.y = t * 0.3;
  });

  return (
    <group ref={groupRef} position={position}>
      {nodes.map((node) => (
        <mesh key={`dna-${node.pos[1].toFixed(3)}-${node.strand}`} position={node.pos}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color="#0a0a0a"
            emissive={node.strand === 0 ? "#00F0FF" : "#BF00FF"}
            emissiveIntensity={0.8}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}
