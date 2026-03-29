import { useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import type { Group } from "three";
import { usePBRTextures } from "~/lib/pbrMaterial";

interface ChainBridgeProps {
  from: [number, number, number];
  to: [number, number, number];
  linkCount?: number;
}

export default function ChainBridge(props: ChainBridgeProps) {
  return (
    <Suspense fallback={null}>
      <ChainBridgeInner {...props} />
    </Suspense>
  );
}

function ChainBridgeInner({ from, to, linkCount = 6 }: ChainBridgeProps) {
  const groupRef = useRef<Group>(null);
  const textures = usePBRTextures("metal_dark", [2, 1]);

  const links = useMemo(() => {
    const result: { pos: [number, number, number]; rot: [number, number, number] }[] = [];
    for (let i = 0; i < linkCount; i++) {
      const t = (i + 0.5) / linkCount;
      const pos: [number, number, number] = [
        from[0] + (to[0] - from[0]) * t,
        from[1] + (to[1] - from[1]) * t,
        from[2] + (to[2] - from[2]) * t,
      ];

      const dx = to[0] - from[0];
      const dz = to[2] - from[2];
      const yaw = Math.atan2(dx, dz);

      const rot: [number, number, number] = [i % 2 === 0 ? 0 : Math.PI / 2, yaw, 0];
      result.push({ pos, rot });
    }
    return result;
  }, [from, to, linkCount]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const children = groupRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const p = i * 1.3;
      children[i].position.x += Math.sin(t * 0.8 + p) * 0.003;
      children[i].position.y += Math.cos(t * 0.6 + p * 0.7) * 0.003;
      children[i].position.z += Math.sin(t * 0.5 + p * 1.1) * 0.002;
      children[i].rotation.x += Math.sin(t * 0.4 + p) * 0.008;
      children[i].rotation.y += Math.cos(t * 0.35 + p * 0.5) * 0.006;
      children[i].rotation.z += Math.sin(t * 0.45 + p * 1.4) * 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      {links.map((link) => (
        <mesh
          key={`bridge-${link.pos[0].toFixed(3)}-${link.pos[1].toFixed(3)}`}
          position={link.pos}
          rotation={link.rot}
        >
          <torusGeometry args={[0.12, 0.025, 12, 20]} />
          <meshStandardMaterial
            {...textures}
            emissive="#00F0FF"
            emissiveIntensity={0.3}
            transparent
            opacity={0.85}
            envMapIntensity={1.5}
          />
        </mesh>
      ))}
    </group>
  );
}
