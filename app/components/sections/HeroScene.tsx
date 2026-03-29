import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import GlitchText from "~/components/canvas/GlitchText";
import ChainBridge from "~/components/canvas/organisms/ChainBridge";
import DNAHelix from "~/components/canvas/organisms/DNAHelix";
import type { ObjectType } from "~/components/canvas/organisms/LivingObject";
import LivingObject from "~/components/canvas/organisms/LivingObject";

interface HeroSceneProps {
  progress: number;
}

// Objects scattered widely — not clustered, more chaotic
const OBJECTS: {
  type: ObjectType;
  pos: [number, number, number];
  scale: number;
  noise: number;
}[] = [
  { type: "blob", pos: [4.5, 2.5, -3], scale: 0.7, noise: 0.2 },
  { type: "crystal", pos: [-5, -1.5, 1.5], scale: 0.6, noise: 0.1 },
  { type: "gear", pos: [3, -3, 2], scale: 0.5, noise: 0.12 },
  { type: "blob", pos: [-3.5, 3.5, -2], scale: 0.4, noise: 0.25 },
  { type: "torus", pos: [1.5, 4, -1], scale: 0.6, noise: 0.15 },
  { type: "crystal", pos: [-2, -4, -1.5], scale: 0.5, noise: 0.08 },
  { type: "gear", pos: [6, 0.5, 0], scale: 0.4, noise: 0.1 },
  { type: "blob", pos: [-6, 1, 2], scale: 0.8, noise: 0.3 },
  { type: "torus", pos: [-1, -2.5, 3], scale: 0.35, noise: 0.1 },
  { type: "crystal", pos: [2, 3.5, -4], scale: 0.45, noise: 0.15 },
];

// Chains connecting distant objects
const CHAINS: [number, number][] = [
  [0, 4],
  [1, 5],
  [2, 7],
  [3, 9],
  [0, 6],
  [4, 9],
];

export default function HeroScene({ progress }: HeroSceneProps) {
  const groupRef = useRef<Group>(null);
  const objectsGroupRef = useRef<Group>(null);
  const camera = useThree((state) => state.camera);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // Each object drifts independently — no uniform group rotation
    if (objectsGroupRef.current) {
      const children = objectsGroupRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        // Each child has its own orbit pattern
        const phase = i * 1.7;
        child.position.x += Math.sin(t * 0.15 + phase) * 0.002;
        child.position.y += Math.cos(t * 0.12 + phase) * 0.002;
        child.position.z += Math.sin(t * 0.1 + phase * 0.5) * 0.001;
      }
    }

    // Camera: scroll drives Z-axis dive
    const cameraZ = 7 - progress * 9;
    const cameraY = Math.sin(progress * Math.PI) * 1.5;
    const cameraX = Math.sin(progress * Math.PI * 0.5) * 2;
    camera.position.set(cameraX, cameraY, cameraZ);
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={groupRef}>
      {/* Objects — scattered, each drifting independently */}
      <group ref={objectsGroupRef}>
        {OBJECTS.map((obj, i) => (
          <LivingObject
            key={`obj-${obj.type}-${obj.pos[0]}`}
            type={obj.type}
            position={obj.pos}
            scale={obj.scale}
            noiseAmplitude={obj.noise}
            index={i}
          />
        ))}

        <DNAHelix position={[5, -2, -3]} />

        {CHAINS.map(([fromIdx, toIdx]) => (
          <ChainBridge
            key={`chain-${fromIdx}-${toIdx}`}
            from={OBJECTS[fromIdx].pos}
            to={OBJECTS[toIdx].pos}
            linkCount={4}
          />
        ))}
      </group>

      {/* Title text */}
      <group position={[0, 0.3, 0.5]}>
        <GlitchText size={0.55} depth={0.1} emissiveIntensity={1.5}>
          UnchainedX
        </GlitchText>
      </group>

      <group position={[0, -0.6, 0.5]}>
        <GlitchText size={0.1} depth={0.01} emissiveIntensity={1.2}>
          Creative Venture Studio
        </GlitchText>
      </group>

      {/* Scroll indicator */}
      {progress < 0.05 && (
        <group position={[0, -2.2, 0]}>
          <GlitchText size={0.05} depth={0.005} emissiveIntensity={0.5}>
            Scroll
          </GlitchText>
        </group>
      )}
    </group>
  );
}
