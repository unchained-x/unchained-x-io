import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
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
      {/* Digital noise fog background */}
      <DigitalFog />

      {/* Cold, minimal lighting */}
      <ambientLight intensity={0.02} />
      <pointLight position={[0, 6, 3]} intensity={2.5} color="#00F0FF" distance={25} decay={2} />
      <pointLight position={[-6, -2, -5]} intensity={1.5} color="#BF00FF" distance={20} decay={2} />
      <pointLight position={[5, 2, -8]} intensity={1} color="#E0E0FF" distance={18} decay={2} />

      {/* Wireframe room — neon cyberpunk colors */}
      {/* Floor — neon grid only, no reflective surface */}
      <mesh position={[0, -4, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 24, 16, 16]} />
        <meshStandardMaterial
          color="#00F0FF"
          emissive="#00F0FF"
          emissiveIntensity={0.15}
          wireframe
          transparent
          opacity={0.12}
          envMapIntensity={0}
        />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 8, -4]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 24, 10, 10]} />
        <meshStandardMaterial
          color="#BF00FF"
          emissive="#BF00FF"
          emissiveIntensity={0.1}
          wireframe
          transparent
          opacity={0.08}
        />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 2, -16]}>
        <planeGeometry args={[24, 12, 12, 8]} />
        <meshStandardMaterial
          color="#00F0FF"
          emissive="#00F0FF"
          emissiveIntensity={0.1}
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>
      {/* Left wall */}
      <mesh position={[-12, 2, -4]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[24, 12, 12, 8]} />
        <meshStandardMaterial
          color="#BF00FF"
          emissive="#BF00FF"
          emissiveIntensity={0.08}
          wireframe
          transparent
          opacity={0.07}
        />
      </mesh>
      {/* Right wall */}
      <mesh position={[12, 2, -4]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[24, 12, 12, 8]} />
        <meshStandardMaterial
          color="#BF00FF"
          emissive="#BF00FF"
          emissiveIntensity={0.08}
          wireframe
          transparent
          opacity={0.07}
        />
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

function DigitalFog() {
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

    // Dark-mid palette — slightly lifted purple-grey
    const whiteBase = color("#2a2035");
    const lightGrey = color("#221a2e");
    const paleBlue = color("#261e38");

    // Height gradient
    const heightMix = p.y.div(30).add(0.5);

    // Animated FBM noise fields
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
    // Domain warp for organic movement
    const warped = fbm(noiseInput2.add(vec2(n1.mul(1.8), n1.mul(1.4))));

    const fog = n1.mul(0.35).add(warped.mul(0.65));

    // Base — bright, shifting white-grey
    const baseColor = mix(whiteBase, mix(lightGrey, paleBlue, heightMix), fog);

    // Purple wisps bleeding through the white fog
    const purpleWisp = vec3(float(0.6), float(0.0), float(0.8)).mul(warped).mul(0.15);
    // Cyan wisps
    const cyanWisp = vec3(float(0.0), float(0.7), float(0.8)).mul(n2).mul(0.1);

    // Subtle white haze in fog peaks
    const whiteHaze = vec3(float(0.7), float(0.65), float(0.75)).mul(fog.sub(0.4).max(0)).mul(0.15);

    return baseColor.add(purpleWisp).add(cyanWisp).add(whiteHaze);
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
