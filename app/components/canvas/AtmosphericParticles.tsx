import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

interface AtmosphericParticlesProps {
  count?: number;
  area?: [number, number, number];
  color?: string;
  size?: number;
  speed?: number;
}

/**
 * Floating dust/embers using individual mesh sprites.
 * Works reliably with WebGPURenderer.
 */
export default function AtmosphericParticles({
  count = 100,
  area = [20, 12, 20],
  color = "#00F0FF",
  size = 0.04,
  speed = 0.1,
}: AtmosphericParticlesProps) {
  const groupRef = useRef<Group>(null);

  // Generate static initial positions
  const particles = useRef(
    Array.from({ length: count }, (_, _i) => ({
      x: (Math.random() - 0.5) * area[0],
      y: Math.random() * area[1] - 2,
      z: (Math.random() - 0.5) * area[2],
      speedY: Math.random() * speed + speed * 0.2,
      phase: Math.random() * Math.PI * 2,
    })),
  ).current;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const children = groupRef.current.children;

    for (let i = 0; i < children.length; i++) {
      const p = particles[i];
      const mesh = children[i];

      let y = p.y + ((t * p.speedY) % area[1]);
      if (y > area[1] - 2) y -= area[1];

      mesh.position.set(
        p.x + Math.sin(t * 0.3 + p.phase) * 0.5,
        y,
        p.z + Math.cos(t * 0.2 + p.phase) * 0.5,
      );
    }
  });

  return (
    <group ref={groupRef}>
      {particles.map((p) => (
        <mesh
          key={`p-${p.x.toFixed(3)}-${p.z.toFixed(3)}-${p.phase.toFixed(3)}`}
          position={[p.x, p.y, p.z]}
        >
          <sphereGeometry args={[size * 0.5, 6, 6]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2}
            transparent
            opacity={0.5}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
