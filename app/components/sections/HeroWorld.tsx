import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import AtmosphericParticles from "~/components/canvas/AtmosphericParticles";
import BackgroundCity from "~/components/canvas/BackgroundCity";
import GlitchText from "~/components/canvas/GlitchText";
import Ground from "~/components/canvas/Ground";
import ChainBridge from "~/components/canvas/organisms/ChainBridge";
import DNAHelix from "~/components/canvas/organisms/DNAHelix";
import type { ObjectType } from "~/components/canvas/organisms/LivingObject";
import LivingObject from "~/components/canvas/organisms/LivingObject";

interface HeroWorldProps {
  visibility: number;
}

const OBJECTS: { type: ObjectType; pos: [number, number, number]; scale: number; noise: number }[] =
  [
    { type: "blob", pos: [4.5, 2.5, -1], scale: 0.7, noise: 0.2 },
    { type: "crystal", pos: [-5, -1.5, 1], scale: 0.6, noise: 0.1 },
    { type: "gear", pos: [3, -3, 2], scale: 0.5, noise: 0.12 },
    { type: "blob", pos: [-3.5, 3.5, -2], scale: 0.4, noise: 0.25 },
    { type: "torus", pos: [3, 1.5, -3], scale: 0.6, noise: 0.15 },
    { type: "crystal", pos: [-3, -1, -3.5], scale: 0.5, noise: 0.08 },
    { type: "gear", pos: [5, 0.5, -4], scale: 0.4, noise: 0.1 },
    { type: "blob", pos: [-4, 2, -5.5], scale: 0.8, noise: 0.3 },
  ];

const CHAINS: [number, number][] = [
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
  [0, 2],
];

export default function HeroWorld({ visibility }: HeroWorldProps) {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.03) * 0.02;
  });

  return (
    <group ref={groupRef}>
      {/* Hero lighting */}
      <ambientLight intensity={0.05} />
      <pointLight position={[0, 8, 2]} intensity={4} color="#00F0FF" distance={40} decay={2} />
      <pointLight position={[-8, 4, 4]} intensity={3} color="#BF00FF" distance={30} decay={2} />
      <pointLight position={[6, 3, -8]} intensity={2} color="#FF4500" distance={25} decay={2} />
      <pointLight position={[0, -1, 0]} intensity={1.5} color="#00F0FF" distance={15} decay={2} />

      {/* Ground */}
      <Ground
        size={120}
        yPos={-3}
        texture="speedway_tiles"
        repeat={[12, 12]}
        envMapIntensity={0.4}
      />

      {/* Background city */}
      <BackgroundCity position={[0, -3, -5]} scale={0.45} rotation={[0, 0.2, 0]} />

      {/* Particles */}
      <AtmosphericParticles
        count={150}
        color="#00F0FF"
        size={0.015}
        speed={0.08}
        area={[25, 15, 30]}
      />
      <AtmosphericParticles
        count={80}
        color="#BF00FF"
        size={0.012}
        speed={0.06}
        area={[20, 12, 25]}
      />

      {/* Objects */}
      {OBJECTS.map((obj, i) => (
        <LivingObject
          key={`obj-${obj.type}-${obj.pos[0]}-${obj.pos[2]}`}
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

      {/* Title */}
      <GlitchText position={[0, 0.3, 0.5]} size={0.35} depth={0.06} emissiveIntensity={1.5}>
        UnchainedX
      </GlitchText>
      <GlitchText
        position={[0, -0.4, 0.5]}
        size={0.07}
        depth={0.008}
        emissiveIntensity={1.0}
        glitchIntensity={0.2}
      >
        Creative Venture Studio
      </GlitchText>
      {visibility > 0.5 && (
        <GlitchText
          position={[0, -1.2, 0.5]}
          size={0.05}
          depth={0.005}
          emissiveIntensity={0.5}
          glitchIntensity={0.4}
        >
          Scroll
        </GlitchText>
      )}
    </group>
  );
}
