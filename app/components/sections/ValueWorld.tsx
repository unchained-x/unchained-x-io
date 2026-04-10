import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef, useState } from "react";
import type { Group, Mesh } from "three";
import * as THREE from "three";
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
import GlitchText from "~/components/canvas/GlitchText";

interface ValueWorldProps {
  visibility: number;
}

/**
 * Value section: Monolith Crystal concept.
 *
 * A massive crystal dominates the scene like igloo.inc's ice blocks.
 * Internal light writhes and pulses. The crystal IS the values — solid,
 * overwhelming, undeniable. Background shimmer syncs to internal energy.
 */
const VALUES = [
  "Be a DOer",
  "Be transparent with passion",
  "Work on hard problems and build networks",
] as const;

const CYCLE_DURATION = 4; // seconds per value

export default function ValueWorld({ visibility }: ValueWorldProps) {
  const groupRef = useRef<Group>(null);
  const crystalRef = useRef<Group>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useFrame(({ clock }) => {
    if (!crystalRef.current) return;
    const t = clock.getElapsedTime();
    crystalRef.current.rotation.y = t * 0.03;

    // Cycle through values
    const idx = Math.floor(t / CYCLE_DURATION) % 3;
    if (idx !== activeIndex) setActiveIndex(idx);
  });

  return (
    <group ref={groupRef}>
      {/* Prism + frost background */}
      <CoreBackground />

      {/* Scene lighting */}
      <ambientLight intensity={0.04} />
      <pointLight position={[4, 5, 3]} intensity={3} color="#BF00FF" distance={25} decay={2} />
      <pointLight position={[-4, 3, -2]} intensity={2} color="#00F0FF" distance={20} decay={2} />
      <pointLight position={[0, -4, 2]} intensity={2} color="#6600FF" distance={18} decay={2} />
      <pointLight position={[0, 0, 3]} intensity={2} color="#E0E0FF" distance={15} decay={2} />

      {/* Crystal */}
      <group ref={crystalRef} scale={[1.2, 1.2, 1.2]}>
        <CrystalModel />
      </group>

      {/* Title — small, beside the crystal */}
      {visibility > 0.05 && (
        <>
          <GlitchText
            position={[1.8, 0.8, 0]}
            size={0.12}
            depth={0.008}
            emissiveColor="#00F0FF"
            emissiveIntensity={1.0}
            glitchIntensity={0.3}
            centered
          >
            Our Values
          </GlitchText>

          {/* Active value — cycles every few seconds */}
          <GlitchText
            key={`value-${activeIndex}`}
            position={[0, -1.5, 0.5]}
            size={0.09}
            depth={0.006}
            emissiveColor="#BF00FF"
            emissiveIntensity={1.5}
            glitchIntensity={0.5}
            centered
          >
            {VALUES[activeIndex]}
          </GlitchText>
        </>
      )}
    </group>
  );
}

function createTextCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  return canvas;
}

function drawValueText(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 1024, 1024);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#BF00FF";
  ctx.font = "bold 52px monospace";
  ctx.shadowColor = "#BF00FF";

  const lines = [
    { text: "Be a DOer", y: 200 },
    { text: "Be transparent", y: 400 },
    { text: "with passion", y: 460 },
    { text: "Work on hard problems", y: 660 },
    { text: "and build networks", y: 720 },
  ];

  for (const line of lines) {
    ctx.shadowBlur = 30;
    ctx.fillText(line.text, 512, line.y);
    ctx.shadowBlur = 8;
    ctx.fillText(line.text, 512, line.y);
  }

  ctx.font = "bold 44px monospace";
  ctx.fillStyle = "#00F0FF";
  ctx.shadowColor = "#00F0FF";
  ctx.shadowBlur = 25;
  ctx.fillText("Our Values", 512, 60);
}

function CrystalModel() {
  const { scene } = useGLTF("/models/crystal.glb");
  const hoverUV = useRef<{ x: number; y: number } | null>(null);

  // Permanent text canvas (drawn once)
  const textCanvas = useMemo(() => {
    const c = createTextCanvas();
    drawValueText(c);
    return c;
  }, []);

  // Display canvas — composited each frame with spotlight mask
  const displayCanvas = useMemo(() => createTextCanvas(), []);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(displayCanvas);
    t.needsUpdate = true;
    return t;
  }, [displayCanvas]);

  // Update spotlight mask each frame
  useFrame(() => {
    const ctx = displayCanvas.getContext("2d")!;
    ctx.clearRect(0, 0, 1024, 1024);

    if (hoverUV.current) {
      const u = hoverUV.current.x * 1024;
      const v = (1 - hoverUV.current.y) * 1024;

      // Draw radial spotlight mask
      ctx.save();
      ctx.globalCompositeOperation = "source-over";

      // Radial gradient as mask
      const radius = 250;
      const grad = ctx.createRadialGradient(u, v, 0, u, v, radius);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.6, "rgba(255,255,255,0.5)");
      grad.addColorStop(1, "rgba(255,255,255,0)");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Composite text through mask
      ctx.globalCompositeOperation = "source-in";
      ctx.drawImage(textCanvas, 0, 0);
      ctx.restore();
    }

    texture.needsUpdate = true;
  });

  const { geometry, material } = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null;
    scene.traverse((child) => {
      if ((child as Mesh).isMesh && !geo) {
        geo = (child as Mesh).geometry;
      }
    });

    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#e8e8f0"),
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.6,
      emissiveMap: texture,
      metalness: 0.0,
      roughness: 0.0,
      transparent: true,
      opacity: 0.5,
      transmission: 0.7,
      thickness: 2.0,
      ior: 2.42,
      envMapIntensity: 3.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      attenuationColor: new THREE.Color("#c0d8ff"),
      attenuationDistance: 0.5,
      specularIntensity: 1.0,
      specularColor: new THREE.Color("#ffffff"),
      side: THREE.DoubleSide,
    });

    return { geometry: geo, material: mat };
  }, [scene, texture]);

  const onHover = useCallback((e: any) => {
    e.stopPropagation();
    if (e.uv) {
      hoverUV.current = { x: e.uv.x, y: e.uv.y };
    }
  }, []);

  const onLeave = useCallback(() => {
    hoverUV.current = null;
  }, []);

  if (!geometry) return null;

  return (
    <group>
      <mesh geometry={geometry} material={material} />
      {/* Hit target */}
      <mesh onPointerMove={onHover} onPointerLeave={onLeave}>
        <boxGeometry args={[2, 2, 1.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function CoreBackground() {
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

    // Prism base + periodic frost freeze
    const voidColor = color("#06040e");
    const darkBase = color("#0a0818");
    const midBase = color("#0e0c20");

    const heightMix = p.y.div(30).add(0.5);

    // FBM noise
    const noiseInput1 = vec2(
      p.x.mul(0.2).add(t.mul(0.12)),
      p.z.mul(0.2).add(p.y.mul(0.08)).add(t.mul(0.1)),
    );
    const noiseInput2 = vec2(
      p.z.mul(0.18).sub(t.mul(0.08)),
      p.y.mul(0.18).add(p.x.mul(0.12)).sub(t.mul(0.09)),
    );

    const n1 = fbm(noiseInput1);
    const n2 = fbm(noiseInput2);
    const warped = fbm(noiseInput2.add(vec2(n1.mul(1.8), n1.mul(1.4))));

    const fog = n1.mul(0.35).add(warped.mul(0.65));

    // Base — dark
    const baseColor = mix(voidColor, mix(darkBase, midBase, heightMix), fog);

    // === Prism (案3) ===
    const hue = p.x.mul(0.05).add(p.y.mul(0.03)).add(p.z.mul(0.04)).add(t.mul(0.06)).add(warped.mul(2.0));
    const r = sin(hue).mul(0.5).add(0.5);
    const g = sin(hue.add(2.094)).mul(0.5).add(0.5);
    const b = sin(hue.add(4.189)).mul(0.5).add(0.5);
    const spectrum = vec3(r, g, b);
    const bandIntensity = warped.sub(0.35).max(0).mul(3.0).min(1);
    const prismLight = spectrum.mul(bandIntensity).mul(0.12);

    // === Frost (案4) ===
    const frostIntensity = fog.sub(0.4).max(0).mul(4.0).min(1);
    const frostColor = mix(
      vec3(float(0.4), float(0.5), float(0.7)),
      vec3(float(0.75), float(0.8), float(0.9)),
      frostIntensity,
    ).mul(frostIntensity).mul(0.12);
    const shimmer = sin(p.x.mul(2.0).add(t.mul(0.3))).mul(cos(p.z.mul(1.8).sub(t.mul(0.25)))).max(0);
    const shimmerColor = vec3(float(0.6), float(0.7), float(0.9)).mul(shimmer).mul(frostIntensity).mul(0.06);
    const frostTotal = frostColor.add(shimmerColor);

    // === Freeze cycle — irregular timing, prism is default ===
    const freezeGate = sin(t.mul(0.15)).mul(sin(t.mul(0.23).add(1.0))).mul(cos(t.mul(0.11).add(2.5)));
    const freezeAmount = freezeGate.sub(0.2).max(0).mul(3.0).min(1);

    // Mix: mostly prism, periodically shifts to frost
    const combined = mix(prismLight, frostTotal, freezeAmount);

    // Accents
    const cyanAccent = vec3(float(0.0), float(0.5), float(0.6)).mul(n2).mul(0.05);
    const purpleAccent = vec3(float(0.3), float(0.0), float(0.5)).mul(fog).mul(0.04);

    return baseColor.add(combined).add(cyanAccent).add(purpleAccent);
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
