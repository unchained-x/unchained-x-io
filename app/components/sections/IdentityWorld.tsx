import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Mesh } from "three";
import {
  abs,
  color,
  cos,
  dot,
  float,
  Fn,
  fract,
  mix,
  normalLocal,
  positionLocal,
  sin,
  uniform,
  vec2,
  vec3,
} from "three/tsl";
import AtmosphericParticles from "~/components/canvas/AtmosphericParticles";
import GlitchText from "~/components/canvas/GlitchText";
import MetaballBlobs from "~/components/canvas/MetaballBlobs";

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

    // Slow rotation of helix
    if (nodesRef.current) {
      nodesRef.current.rotation.y = t * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Animated water background */}
      <WaterBackground />

      {/* Underwater lighting */}
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 10, 0]} intensity={5} color="#00D0E0" distance={40} decay={2} />
      <pointLight position={[-5, 6, 3]} intensity={3} color="#00F0FF" distance={30} decay={2} />
      <pointLight position={[4, -3, -3]} intensity={2} color="#BF00FF" distance={25} decay={2} />

      {/* Metaball blobs — real mesh with glass-like material */}
      <MetaballBlobs />

      {/* Bubbles — transparent, soft, realistic */}
      <Bubbles />

      {/* Text */}
      {visibility > 0.05 && (
        <>
          <GlitchText
            position={[0, 1.2, 0]}
            size={0.28}
            depth={0.025}
            emissiveColor="#BF00FF"
            emissiveIntensity={1.3}
            glitchIntensity={0.6}
          >
            Who We Are
          </GlitchText>
          {visibility > 0.15 && (
            <>
              <GlitchText
                position={[0, 0, 0]}
                size={0.1}
                depth={0.008}
                emissiveColor="#00F0FF"
                emissiveIntensity={0.9}
                glitchIntensity={0.1}
              >
                An entity that experimentally architects and expands
              </GlitchText>
              <GlitchText
                position={[0, -0.45, 0]}
                size={0.1}
                depth={0.008}
                emissiveColor="#00F0FF"
                emissiveIntensity={0.9}
                glitchIntensity={0.1}
              >
                the potential of value, networks, and humanity through technology and creativity.
              </GlitchText>
              <GlitchText
                position={[0, -0.9, 0]}
                size={0.1}
                depth={0.008}
                emissiveColor="#00F0FF"
                emissiveIntensity={0.9}
                glitchIntensity={0.1}
              >
                We undertake extraordinary complexity fundamentally and structurally.
              </GlitchText>
            </>
          )}
        </>
      )}
    </group>
  );
}

function Bubbles() {
  const groupRef = useRef<Group>(null);

  const bubbles = useMemo(
    () =>
      Array.from({ length: 100 }, (_, i) => ({
        x: (Math.random() - 0.5) * 12,
        y: Math.random() * 12 - 4,
        z: (Math.random() - 0.5) * 8 - 3,
        size: 0.02 + Math.random() * 0.03,
        speedY: 0.003 + Math.random() * 0.008,
        wobble: Math.random() * Math.PI * 2,
      })),
    [],
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const children = groupRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const b = bubbles[i];
      if (!b) continue;
      // Rise + wobble
      let y = b.y + ((t * b.speedY * 60) % 14);
      if (y > 8) y -= 14;
      children[i].position.set(
        b.x + Math.sin(t * 0.5 + b.wobble) * 0.3,
        y,
        b.z + Math.cos(t * 0.4 + b.wobble) * 0.2,
      );
    }
  });

  return (
    <group ref={groupRef}>
      {bubbles.map((b) => (
        <mesh key={`bub-${b.x.toFixed(3)}-${b.z.toFixed(3)}`} position={[b.x, b.y, b.z]}>
          <sphereGeometry args={[b.size, 12, 12]} />
          <meshStandardMaterial
            color="#a0d8e8"
            emissive="#80c0d0"
            emissiveIntensity={0.15}
            transparent
            opacity={0.2}
            metalness={0.3}
            roughness={0.1}
            envMapIntensity={1}
          />
        </mesh>
      ))}
    </group>
  );
}

function WaterBackground() {
  const uTime = useMemo(() => uniform(0.0), []);

  // Hash-based pseudo-noise — no visible wave pattern
  const hash = Fn(([p]: [any]) => {
    return fract(sin(dot(p, vec2(127.1, 311.7))).mul(43758.5453));
  });

  const noise = Fn(([p]: [any]) => {
    const i = vec2(p.x.floor(), p.y.floor());
    const f = vec2(fract(p.x), fract(p.y));
    // Smoothstep interpolation
    const u = f.mul(f).mul(float(3).sub(f.mul(2)));

    const a = hash(i);
    const b = hash(i.add(vec2(1, 0)));
    const c = hash(i.add(vec2(0, 1)));
    const d = hash(i.add(vec2(1, 1)));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  });

  // FBM — layered noise at different scales for organic detail
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

    // Deep ocean palette — slightly neon-shifted
    const deepColor = color("#0c3858");
    const midColor = color("#1e7090");
    const lightColor = color("#3090b0");

    // Height-based gradient
    const heightMix = p.y.div(30).add(0.5);

    // --- FBM noise on sphere surface, animated by time ---
    // Higher spatial frequency + faster time = more active wavering
    const noiseInput1 = vec2(
      p.x.mul(0.35).add(t.mul(0.3)),
      p.z.mul(0.35).add(p.y.mul(0.15)).add(t.mul(0.25)),
    );
    const noiseInput2 = vec2(
      p.z.mul(0.3).sub(t.mul(0.2)),
      p.y.mul(0.3).add(p.x.mul(0.2)).sub(t.mul(0.22)),
    );
    // Two independent noise fields — combine for extra irregularity
    const n1 = fbm(noiseInput1);
    const n2 = fbm(noiseInput2);
    // Domain warping: use first noise to distort the second
    const warped = fbm(noiseInput2.add(vec2(n1.mul(1.5), n1.mul(1.2))));
    const caustic = n1.mul(0.4).add(warped.mul(0.6));

    // --- Irregular impulses via noise threshold ---
    // Time-varying noise field — impulse fires where noise crosses a high threshold
    const impulseNoise = fbm(vec2(
      p.x.mul(0.2).add(t.mul(0.4)),
      p.z.mul(0.2).sub(t.mul(0.35)),
    ));
    // Only the highest peaks create impulse (top ~15% of noise range)
    const impulseThreshold = impulseNoise.sub(0.55).max(0).mul(4.0);
    // Gate by irregular time — prevents constant firing
    const timeGate = sin(t.mul(0.73).add(1.7)).mul(sin(t.mul(1.31).add(3.1))).mul(cos(t.mul(0.53)));
    const impulse = impulseThreshold.mul(timeGate.max(0)).mul(0.25);

    // --- Slow irregular drift ---
    const drift = sin(t.mul(0.13)).mul(cos(t.mul(0.19).add(1.0))).mul(0.06).add(0.94);

    // Base color with depth gradient
    const baseColor = mix(deepColor, mix(midColor, lightColor, heightMix), heightMix);

    // Caustic light — irregular shimmer
    const causticLight = vec3(float(0), float(0.94), float(1.0)).mul(caustic).mul(0.1);
    // Purple undertone from second noise layer
    const purpleLight = vec3(float(0.5), float(0), float(0.7)).mul(n2).mul(0.05);
    // Impulse flash — cyan burst at random spots
    const impulseLight = vec3(float(0), float(0.85), float(1.0)).mul(impulse);

    return baseColor.add(causticLight).add(purpleLight).add(impulseLight).mul(drift);
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
