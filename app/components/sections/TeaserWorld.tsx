import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import AtmosphericParticles from "~/components/canvas/AtmosphericParticles";
import GlitchText from "~/components/canvas/GlitchText";

interface TeaserWorldProps {
  visibility: number;
}

/**
 * Teaser section: "Not yet chained. Not yet designed. That's what we take on."
 *
 * Visual: Wireframe architectural structures floating in dark space.
 * Unfinished blueprints — things not yet designed.
 * Neon grid floor. Data particles drifting.
 */
export default function TeaserWorld({ visibility }: TeaserWorldProps) {
  const groupRef = useRef<Group>(null);
  const structuresRef = useRef<Group>(null);

  // Wireframe structures — scattered throughout the space
  const structures = useMemo(
    () => [
      {
        type: "box" as const,
        pos: [-4, 2, -3] as [number, number, number],
        scale: [2, 3, 1.5] as [number, number, number],
        rotSpeed: 0.08,
      },
      {
        type: "box" as const,
        pos: [5, 1, -5] as [number, number, number],
        scale: [1.5, 4, 2] as [number, number, number],
        rotSpeed: 0.06,
      },
      {
        type: "box" as const,
        pos: [0, 3, -7] as [number, number, number],
        scale: [3, 1, 2] as [number, number, number],
        rotSpeed: 0.1,
      },
      {
        type: "icosa" as const,
        pos: [3, -1, -2] as [number, number, number],
        scale: [1.2, 1.2, 1.2] as [number, number, number],
        rotSpeed: 0.12,
      },
      {
        type: "icosa" as const,
        pos: [-3, -2, -6] as [number, number, number],
        scale: [0.8, 0.8, 0.8] as [number, number, number],
        rotSpeed: 0.15,
      },
      {
        type: "torus" as const,
        pos: [-6, 0, -4] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number],
        rotSpeed: 0.07,
      },
      {
        type: "torus" as const,
        pos: [6, 3, -8] as [number, number, number],
        scale: [1.5, 1.5, 1.5] as [number, number, number],
        rotSpeed: 0.05,
      },
      {
        type: "box" as const,
        pos: [2, 4, -4] as [number, number, number],
        scale: [0.5, 0.5, 2] as [number, number, number],
        rotSpeed: 0.2,
      },
      {
        type: "box" as const,
        pos: [-5, 3, -2] as [number, number, number],
        scale: [0.3, 2, 0.3] as [number, number, number],
        rotSpeed: 0.18,
      },
      {
        type: "icosa" as const,
        pos: [7, -3, -9] as [number, number, number],
        scale: [0.6, 0.6, 0.6] as [number, number, number],
        rotSpeed: 0.22,
      },
      {
        type: "box" as const,
        pos: [-7, -2.5, -1] as [number, number, number],
        scale: [1.8, 0.5, 1.2] as [number, number, number],
        rotSpeed: 0.09,
      },
      {
        type: "torus" as const,
        pos: [8, -1.5, -4] as [number, number, number],
        scale: [0.9, 0.9, 0.9] as [number, number, number],
        rotSpeed: 0.11,
      },
      {
        type: "box" as const,
        pos: [-2, -3.5, -9] as [number, number, number],
        scale: [0.4, 1.5, 0.4] as [number, number, number],
        rotSpeed: 0.14,
      },
      {
        type: "icosa" as const,
        pos: [-8, -1, -7] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number],
        rotSpeed: 0.08,
      },
    ],
    [],
  );

  useFrame(({ clock }) => {
    if (!groupRef.current || !structuresRef.current) return;
    const t = clock.getElapsedTime();

    // Structures drift and rotate slowly
    const children = structuresRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const s = structures[i];
      if (!s) continue;
      const phase = i * 1.3;
      children[i].rotation.x += Math.sin(t * 0.2 + phase) * s.rotSpeed * 0.01;
      children[i].rotation.y += s.rotSpeed * 0.008;
      children[i].rotation.z += Math.cos(t * 0.15 + phase) * s.rotSpeed * 0.005;
      children[i].position.y = s.pos[1] + Math.sin(t * 0.3 + phase) * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Dark purple background sphere */}
      <mesh>
        <sphereGeometry args={[30, 16, 16]} />
        <meshBasicMaterial color="#0a0420" side={1} />
      </mesh>

      {/* Cold, minimal lighting */}
      <ambientLight intensity={0.02} />
      <pointLight position={[0, 6, 3]} intensity={2.5} color="#00F0FF" distance={25} decay={2} />
      <pointLight position={[-6, -2, -5]} intensity={1.5} color="#BF00FF" distance={20} decay={2} />
      <pointLight position={[5, 2, -8]} intensity={1} color="#E0E0FF" distance={18} decay={2} />

      {/* Wireframe room — walls/ceiling/floor as transparent wireframe enclosure */}
      {/* Floor */}
      <mesh position={[0, -4, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 24, 12, 12]} />
        <meshBasicMaterial color="#00F0FF" wireframe transparent opacity={0.08} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 8, -4]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 24, 8, 8]} />
        <meshBasicMaterial color="#BF00FF" wireframe transparent opacity={0.04} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 2, -16]}>
        <planeGeometry args={[24, 12, 10, 6]} />
        <meshBasicMaterial color="#00F0FF" wireframe transparent opacity={0.05} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-12, 2, -4]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[24, 12, 10, 6]} />
        <meshBasicMaterial color="#BF00FF" wireframe transparent opacity={0.04} />
      </mesh>
      {/* Right wall */}
      <mesh position={[12, 2, -4]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[24, 12, 10, 6]} />
        <meshBasicMaterial color="#BF00FF" wireframe transparent opacity={0.04} />
      </mesh>

      {/* Wireframe structures — unfinished designs */}
      <group ref={structuresRef}>
        {structures.map((s) => (
          <mesh key={`struct-${s.pos[0]}-${s.pos[1]}-${s.pos[2]}`} position={s.pos} scale={s.scale}>
            {s.type === "box" && <boxGeometry args={[1, 1, 1]} />}
            {s.type === "icosa" && <icosahedronGeometry args={[0.7, 1]} />}
            {s.type === "torus" && <torusGeometry args={[0.5, 0.15, 8, 16]} />}
            <meshStandardMaterial
              color="#00F0FF"
              emissive="#00F0FF"
              emissiveIntensity={0.2}
              wireframe
              transparent
              opacity={0.6}
            />
          </mesh>
        ))}
      </group>

      {/* Floating particles */}
      <AtmosphericParticles
        count={120}
        color="#00F0FF"
        size={0.012}
        speed={0.06}
        area={[20, 12, 20]}
      />
      <AtmosphericParticles
        count={60}
        color="#BF00FF"
        size={0.01}
        speed={0.04}
        area={[15, 10, 15]}
      />

      {/* Text */}
      {visibility > 0.05 && (
        <group position={[0, 0, 0]}>
          <GlitchText
            position={[0, 0.2, 0]}
            size={0.16}
            depth={0.02}
            emissiveIntensity={1.2}
            glitchIntensity={0.6}
            emissiveColor="#BF00FF"
            centered
          >
            Not yet chained. Not yet designed.
          </GlitchText>
          <GlitchText
            position={[0, -0.2, 0]}
            size={0.16}
            depth={0.02}
            emissiveIntensity={1.2}
            glitchIntensity={0.6}
            emissiveColor="#BF00FF"
            centered
          >
            That's what we take on.
          </GlitchText>
        </group>
      )}
    </group>
  );
}
