import { Cloud } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import {
  color,
  cos,
  dot,
  float,
  Fn,
  fract,
  mix,
  positionLocal,
  sin,
  uniform,
  vec2,
  vec3,
} from "three/tsl";
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

  useEffect(() => {
    console.log("[HeroWorld] MOUNTED");
    return () => console.log("[HeroWorld] UNMOUNTED");
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.03) * 0.02;
  });

  return (
    <group ref={groupRef}>
      {/* Hero lighting — triadic + split-complementary palette around cyan/purple base */}
      <ambientLight intensity={0.08} />
      {/* Top center — primary cyan */}
      <pointLight position={[0, 8, 2]} intensity={4} color="#00F0FF" distance={40} decay={2} />
      {/* Left high — primary purple */}
      <pointLight position={[-8, 4, 4]} intensity={3} color="#BF00FF" distance={30} decay={2} />
      {/* Right far — split-comp warm amber */}
      <pointLight position={[6, 3, -8]} intensity={1.8} color="#FF8C00" distance={25} decay={2} />
      {/* Below center — teal (analogous to cyan) */}
      <pointLight position={[0, -2, 0]} intensity={2} color="#00CED1" distance={18} decay={2} />
      {/* Right low — magenta purple */}
      <pointLight position={[5, -1, 3]} intensity={2.5} color="#BF00FF" distance={20} decay={2} />
      {/* Left behind — deep violet */}
      <pointLight position={[-6, 2, -5]} intensity={2.5} color="#8A00E6" distance={25} decay={2} />
      {/* Front low — cool white fill */}
      <pointLight position={[0, 0, 6]} intensity={1.2} color="#E0E0FF" distance={20} decay={2} />
      {/* Top right — chartreuse green (triadic from purple) */}
      <pointLight position={[7, 6, -2]} intensity={1.5} color="#7FFF00" distance={22} decay={2} />

      {/* Ground */}
      <Ground
        size={120}
        yPos={-3}
        texture="speedway_tiles"
        repeat={[12, 12]}
        envMapIntensity={0.4}
      />

      {/* FBM noise background */}
      <HeroFog />

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

      {/* Smoke behind text */}
      <TextSmoke />

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


function HeroFog() {
  const uTime = useMemo(() => uniform(0.0), []);

  const hash = Fn(([p]: [any]) => {
    return fract(sin(dot(p, vec2(127.1, 311.7))).mul(43758.5453));
  });

  const noise = Fn(([p]: [any]) => {
    const i = vec2(p.x.floor(), p.y.floor());
    const f = vec2(fract(p.x), fract(p.y));
    const u = f.mul(f).mul(float(3).sub(f.mul(2)));
    const a = hash(i);
    const b = hash(i.add(vec2(1, 0)));
    const c = hash(i.add(vec2(0, 1)));
    const d = hash(i.add(vec2(1, 1)));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  });

  const fbm = Fn(([p]: [any]) => {
    const o1 = noise(p).mul(0.5);
    const o2 = noise(p.mul(2.0).add(3.7)).mul(0.25);
    const o3 = noise(p.mul(4.0).add(7.3)).mul(0.125);
    const o4 = noise(p.mul(8.0).add(13.1)).mul(0.0625);
    return o1.add(o2).add(o3).add(o4);
  });

  const colorNode = useMemo(() => {
    const p = positionLocal;
    const t = uTime;

    // Dark cyber palette — lifted to show noise
    const deepColor = color("#120a1e");
    const midColor = color("#1a1230");
    const highColor = color("#221840");

    const heightMix = p.y.div(30).add(0.5);

    // FBM noise fields — soft fog, matching Teaser quality
    const noiseInput1 = vec2(
      p.x.mul(0.25).add(t.mul(0.15)),
      p.z.mul(0.25).add(p.y.mul(0.1)).add(t.mul(0.12)),
    );
    const noiseInput2 = vec2(
      p.z.mul(0.2).sub(t.mul(0.1)),
      p.y.mul(0.2).add(p.x.mul(0.15)).sub(t.mul(0.13)),
    );

    const n1 = fbm(noiseInput1);
    const n2 = fbm(noiseInput2);
    // Domain warping
    const warped = fbm(noiseInput2.add(vec2(n1.mul(1.8), n1.mul(1.4))));

    const fog = n1.mul(0.35).add(warped.mul(0.65));

    // Base color driven by fog
    const baseColor = mix(deepColor, mix(midColor, highColor, heightMix), fog);

    // Cyan wisps
    const cyanWisp = vec3(float(0.0), float(0.6), float(0.7)).mul(fog).mul(0.13);
    // Purple haze
    const purpleWisp = vec3(float(0.4), float(0.0), float(0.5)).mul(n2).mul(0.1);
    // Amber flicker — warm city light bleeding through
    const amberWisp = vec3(float(0.6), float(0.3), float(0.0)).mul(warped.sub(0.4).max(0)).mul(0.13);

    // White haze in fog peaks
    const whiteHaze = vec3(float(0.7), float(0.65), float(0.75)).mul(fog.sub(0.4).max(0)).mul(0.15);

    return baseColor.add(cyanWisp).add(purpleWisp).add(amberWisp).add(whiteHaze);
  }, [uTime, hash, noise, fbm]);

  useFrame(({ clock }) => {
    uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh>
      <sphereGeometry args={[30, 32, 32]} />
      <meshBasicNodeMaterial colorNode={colorNode} side={1} />
    </mesh>
  );
}

const TextSmoke = memo(function TextSmoke() {
  return (
    <Cloud
      position={[0, 0.1, -1.5]}
      opacity={0.045}
      speed={0.04}
      width={0.5}
      depth={0.05}
      segments={1}
      color="#ffffff"
      seed={3}
    />
  );
});
