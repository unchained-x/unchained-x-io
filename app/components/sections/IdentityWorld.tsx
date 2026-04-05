import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Mesh } from "three";
import GlitchText from "~/components/canvas/GlitchText";
import VolumetricFog from "~/components/canvas/VolumetricFog";

interface IdentityWorldProps {
  visibility: number;
}

interface NetworkNode {
  pos: [number, number, number];
  connections: number[];
}

/**
 * Identity section: Network structure forms.
 *
 * Visual: Nodes appear and connect with energy lines.
 * Purple-shifted lighting. Structured yet organic.
 * Feeling: connection, intelligence, architecture.
 */
export default function IdentityWorld({ visibility }: IdentityWorldProps) {
  const groupRef = useRef<Group>(null);
  const nodesRef = useRef<Group>(null);
  const linesRef = useRef<Group>(null);

  // Network layout
  const network = useMemo<NetworkNode[]>(
    () => [
      { pos: [0, 0, 0], connections: [1, 2, 3] },
      { pos: [3, 2, -1], connections: [0, 4, 5] },
      { pos: [-3, 1, 1], connections: [0, 5, 6] },
      { pos: [1, -2, 2], connections: [0, 4, 7] },
      { pos: [4, 0, -3], connections: [1, 3, 8] },
      { pos: [-2, 3, -2], connections: [1, 2, 9] },
      { pos: [-4, -1, 0], connections: [2, 7, 9] },
      { pos: [2, -3, -1], connections: [3, 6, 8] },
      { pos: [5, -2, -4], connections: [4, 7] },
      { pos: [-3, 4, -3], connections: [5, 6] },
    ],
    [],
  );

  // Unique edges (no duplicates)
  const edges = useMemo(() => {
    const set = new Set<string>();
    const result: [number, number][] = [];
    for (let i = 0; i < network.length; i++) {
      for (const j of network[i].connections) {
        const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
        if (!set.has(key)) {
          set.add(key);
          result.push([i, j]);
        }
      }
    }
    return result;
  }, [network]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // Slow rotation of entire network
    groupRef.current.rotation.y = t * 0.05;
    groupRef.current.rotation.x = Math.sin(t * 0.08) * 0.03;

    // Nodes pulse
    if (nodesRef.current) {
      const children = nodesRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const node = children[i] as Mesh;
        const pulse = 0.8 + Math.sin(t * 2 + i * 0.7) * 0.2;
        node.scale.setScalar(pulse * visibility);

        const mat = node.material as { emissiveIntensity?: number };
        if (mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = 0.5 + Math.sin(t * 3 + i) * 0.3;
        }
      }
    }

    // Energy lines pulse
    if (linesRef.current) {
      const children = linesRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const mat = (children[i] as Mesh).material as { opacity?: number };
        if (mat.opacity !== undefined) {
          mat.opacity = (0.3 + Math.sin(t * 2.5 + i * 1.1) * 0.2) * visibility;
        }
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Purple-shifted lighting */}
      <ambientLight intensity={0.03} />
      <pointLight position={[0, 4, 4]} intensity={3} color="#BF00FF" distance={25} decay={2} />
      <pointLight position={[5, -2, -3]} intensity={2} color="#00F0FF" distance={20} decay={2} />
      <pointLight position={[-4, 3, -5]} intensity={1.5} color="#E0E0FF" distance={18} decay={2} />

      {/* Fog */}
      <VolumetricFog position={[0, -1, -1]} color="#0a0320" opacity={0.1} speed={0.25} />

      {/* Network nodes */}
      <group ref={nodesRef}>
        {network.map((node) => (
          <mesh key={`node-${node.pos[0]}-${node.pos[1]}-${node.pos[2]}`} position={node.pos}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial
              color="#0a0a0a"
              emissive="#BF00FF"
              emissiveIntensity={0.6}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
        ))}
      </group>

      {/* Energy lines between nodes */}
      <group ref={linesRef}>
        {edges.map(([fromIdx, toIdx]) => {
          const from = network[fromIdx].pos;
          const to = network[toIdx].pos;
          const midX = (from[0] + to[0]) / 2;
          const midY = (from[1] + to[1]) / 2;
          const midZ = (from[2] + to[2]) / 2;
          const dx = to[0] - from[0];
          const dy = to[1] - from[1];
          const dz = to[2] - from[2];
          const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const rotY = Math.atan2(dx, dz);
          const rotX = -Math.asin(dy / length);

          return (
            <mesh
              key={`edge-${fromIdx}-${toIdx}`}
              position={[midX, midY, midZ]}
              rotation={[rotX, rotY, 0]}
            >
              <cylinderGeometry args={[0.008, 0.008, length, 4]} />
              <meshBasicMaterial color="#BF00FF" transparent opacity={0.4} />
            </mesh>
          );
        })}
      </group>

      {/* Text */}
      {visibility > 0.05 && (
        <>
          <GlitchText
            position={[0, 5, 0]}
            size={0.2}
            depth={0.025}
            emissiveColor="#BF00FF"
            emissiveIntensity={1.3}
            glitchIntensity={0.5}
          >
            Who We Are
          </GlitchText>
          {visibility > 0.15 && (
            <>
              <GlitchText
                position={[0, -4, 0]}
                size={0.055}
                depth={0.006}
                emissiveIntensity={0.8}
                glitchIntensity={0.1}
              >
                An entity that experimentally architects
              </GlitchText>
              <GlitchText
                position={[0, -4.6, 0]}
                size={0.055}
                depth={0.006}
                emissiveIntensity={0.8}
                glitchIntensity={0.1}
              >
                and expands the potential of value,
              </GlitchText>
              <GlitchText
                position={[0, -5.2, 0]}
                size={0.055}
                depth={0.006}
                emissiveIntensity={0.8}
                glitchIntensity={0.1}
              >
                networks, and humanity through
              </GlitchText>
              <GlitchText
                position={[0, -5.8, 0]}
                size={0.055}
                depth={0.006}
                emissiveIntensity={0.8}
                glitchIntensity={0.1}
              >
                technology and creativity.
              </GlitchText>
            </>
          )}
        </>
      )}
    </group>
  );
}
