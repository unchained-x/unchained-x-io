import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import type { Group, Mesh } from "three";
import ChainLink from "./ChainLink";
import ParticleBurst from "./ParticleBurst";

interface LoadingSceneProps {
  progress: number; // 0 to 1
  onComplete: () => void;
}

const CHAIN_LINKS = 6;

function getChainPositions(): { pos: [number, number, number]; rot: [number, number, number] }[] {
  const links: { pos: [number, number, number]; rot: [number, number, number] }[] = [];
  for (let i = 0; i < CHAIN_LINKS; i++) {
    const x = (i - (CHAIN_LINKS - 1) / 2) * 0.7;
    const rotZ = i % 2 === 0 ? 0 : Math.PI / 2;
    links.push({ pos: [x, 0, 0], rot: [0, 0, rotZ] });
  }
  return links;
}

export default function LoadingScene({ progress, onComplete }: LoadingSceneProps) {
  const groupRef = useRef<Group>(null);
  const hasStartedExplosion = useRef(false);
  const [showChains, setShowChains] = useState(true);
  const [showParticles, setShowParticles] = useState(false);
  const chainPositions = useMemo(() => getChainPositions(), []);
  const particleOrigins = useMemo(() => chainPositions.map((l) => l.pos), [chainPositions]);

  const visibleLinks = Math.max(1, Math.ceil(progress * CHAIN_LINKS));
  const isComplete = progress >= 1;
  const showLightning = progress > 0.85 || isComplete;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    if (!isComplete) {
      // Normal rotation
      groupRef.current.rotation.y = t * 0.3;
      groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    } else {
      if (!hasStartedExplosion.current) {
        hasStartedExplosion.current = true;
        setShowChains(false);
        setShowParticles(true);
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={isComplete ? 3 : 1} color="#00F0FF" />

      {/* Chain links */}
      {showChains && (
        <group ref={groupRef}>
          {chainPositions.map((link, i) => (
            <ChainLink
              key={`chain-${link.pos[0]}`}
              position={link.pos}
              rotation={link.rot}
              visible={i < visibleLinks}
              index={i}
              intensityOverride={isComplete ? 3.0 : undefined}
            />
          ))}

          {/* Lightning arcs between adjacent links */}
          {showLightning &&
            chainPositions.slice(0, visibleLinks - 1).map((link, i) => {
              const next = chainPositions[i + 1];
              return (
                <LightningBolt
                  key={`bolt-${link.pos[0]}`}
                  start={link.pos}
                  end={next.pos}
                  intensity={isComplete ? 1.0 : 0.4}
                />
              );
            })}
        </group>
      )}

      {/* Particle explosion */}
      <ParticleBurst origins={particleOrigins} active={showParticles} onScattered={onComplete} />
    </>
  );
}

// Simple lightning bolt between two points

function LightningBolt({
  start,
  end,
  intensity,
}: {
  start: [number, number, number];
  end: [number, number, number];
  intensity: number;
}) {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const flicker = Math.random() > 0.3 ? intensity : intensity * 0.2;
    const mat = meshRef.current.material as { opacity?: number };
    mat.opacity = flicker;
  });

  const midX = (start[0] + end[0]) / 2;
  const midY = (start[1] + end[1]) / 2;
  const midZ = (start[2] + end[2]) / 2;
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.sqrt(dx * dx + dy * dy) + 0.1;

  return (
    <mesh ref={meshRef} position={[midX, midY, midZ + 0.1]}>
      <planeGeometry args={[length, 0.03]} />
      <meshBasicMaterial color="#00F0FF" transparent opacity={intensity} />
    </mesh>
  );
}
