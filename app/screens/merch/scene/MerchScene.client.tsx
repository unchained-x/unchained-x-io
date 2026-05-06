import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import * as THREE from "three/webgpu";
import { bloom } from "~/components/three/tsl/BloomNode.js";
import {
  color,
  cos,
  dot,
  emissive,
  float,
  Fn,
  fract,
  mix,
  mrt,
  output,
  pass,
  positionLocal,
  sin,
  smoothstep,
  uniform,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import Environment from "~/components/three/environment/Environment";
import ScenePostProcessing from "~/components/three/post/ScenePostProcessing";
import WebGPUCanvas from "~/components/three/canvas/WebGPUCanvas.client";

// --- Shared noise (from common module) ---
import { hash as hashFn, noise2d as noiseFn, fbm as fbmFn } from "~/components/three/tsl/noise";

// --- Showcase background ---
function ShowcaseBackground() {
  const uTime = useMemo(() => uniform(0.0), []);

  const colorNode = useMemo(() => {
    const p = positionLocal;
    const t = uTime;

    // Bright, airy palette — lavender/silver
    const darkBase = color("#12101e");
    const midBase = color("#1e1a30");
    const brightBase = color("#2a2445");
    const heightMix = p.y.div(30).add(0.5);

    // Primary noise
    const ni1 = vec2(p.x.mul(0.25).add(t.mul(0.15)), p.z.mul(0.25).add(p.y.mul(0.12)).add(t.mul(0.12)));
    const n1 = fbmFn(ni1);

    const ni2 = vec2(p.z.mul(0.2).sub(t.mul(0.12)), p.y.mul(0.22).add(p.x.mul(0.15)).sub(t.mul(0.1)));
    const n2 = fbmFn(ni2);

    // Domain warping
    const warped = fbmFn(ni2.add(vec2(n1.mul(1.8), n1.mul(1.4))));

    const fog = n1.mul(0.35).add(warped.mul(0.65));
    const baseColor = mix(darkBase, mix(midBase, brightBase, fog), heightMix);

    // === UNIQUE: Silk waves — smooth, flowing luminous ribbons ===
    const silkInput = vec2(
      p.x.mul(0.3).add(sin(t.mul(0.2)).mul(0.6)),
      p.y.mul(0.15).add(cos(t.mul(0.15)).mul(0.4)).add(warped.mul(1.5)),
    );
    const silkNoise = fbmFn(silkInput);
    const silkBand = sin(silkNoise.mul(8.0)).mul(0.5).add(0.5);
    const silkMask = smoothstep(float(0.4), float(0.6), silkBand);
    const silkCyan = vec3(float(0.0), float(0.85), float(1.0)).mul(silkMask).mul(0.12);
    const silkMagenta = vec3(float(0.9), float(0.1), float(0.6)).mul(float(1.0).sub(silkMask)).mul(silkBand).mul(0.08);

    // Bright haze — overall luminosity
    const hazeIntensity = fog.sub(0.2).max(0).mul(2.0).min(1.0);
    const haze = vec3(float(0.5), float(0.45), float(0.65)).mul(hazeIntensity).mul(0.15);

    // Purple glow
    const purpleGlow = vec3(float(0.5), float(0.15), float(0.7)).mul(warped.sub(0.25).max(0).mul(2.5)).mul(0.1);

    // White shimmer peaks
    const shimmer = noiseFn(vec2(p.x.mul(4.0).add(t.mul(0.4)), p.z.mul(4.0).sub(t.mul(0.3)))).sub(0.9).max(0).mul(10.0);
    const shimmerColor = vec3(float(0.9), float(0.85), float(1.0)).mul(shimmer).mul(0.12);

    // Breathing
    const breathe = sin(t.mul(0.11)).mul(cos(t.mul(0.17))).mul(0.02).add(0.98);

    return baseColor.add(silkCyan).add(silkMagenta).add(haze).add(purpleGlow).add(shimmerColor).mul(breathe);
  }, [uTime]);

  useFrame(({ clock }) => { uTime.value = clock.getElapsedTime(); });

  return (
    <mesh>
      <sphereGeometry args={[30, 12, 12]} />
      <meshBasicNodeMaterial colorNode={colorNode} side={1} />
    </mesh>
  );
}

// --- Procedural mannequin point cloud ---
function MannequinPointCloud() {
  const groupRef = useRef<Group>(null);

  const geometry = useMemo(() => {
    const points: number[] = [];
    const addSphere = (cx: number, cy: number, cz: number, r: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        points.push(
          cx + Math.sin(phi) * Math.cos(theta) * r,
          cy + Math.sin(phi) * Math.sin(theta) * r,
          cz + Math.cos(phi) * r,
        );
      }
    };
    const addCylinder = (cx: number, cy: number, cz: number, r: number, h: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const y = (Math.random() - 0.5) * h;
        points.push(
          cx + Math.cos(theta) * r,
          cy + y,
          cz + Math.sin(theta) * r,
        );
      }
    };

    // Head
    addSphere(0, 2.2, 0, 0.35, 400);
    // Neck
    addCylinder(0, 1.85, 0, 0.12, 0.3, 100);
    // Torso
    addCylinder(0, 1.0, 0, 0.45, 1.2, 800);
    // Shoulders
    addSphere(-0.55, 1.55, 0, 0.15, 150);
    addSphere(0.55, 1.55, 0, 0.15, 150);
    // Arms
    addCylinder(-0.65, 0.9, 0, 0.1, 1.0, 300);
    addCylinder(0.65, 0.9, 0, 0.1, 1.0, 300);
    // Hips
    addCylinder(0, 0.15, 0, 0.35, 0.4, 300);
    // Legs
    addCylinder(-0.2, -0.7, 0, 0.12, 1.2, 400);
    addCylinder(0.2, -0.7, 0, 0.12, 1.2, 400);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(points), 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.3;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <points geometry={geometry}>
        <pointsMaterial
          color="#00F0FF"
          size={0.015}
          sizeAttenuation
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// --- Hanger point cloud ---
function HangerPointCloud({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<Group>(null);

  const geometry = useMemo(() => {
    const points: number[] = [];
    // Hook (top curve)
    for (let i = 0; i < 80; i++) {
      const a = (i / 80) * Math.PI * 1.5 - Math.PI * 0.25;
      const r = 0.15;
      points.push(Math.cos(a) * r, 1.5 + Math.sin(a) * r + r, 0);
    }
    // Triangle body
    const addLine = (x1: number, y1: number, x2: number, y2: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const t = i / count;
        points.push(
          x1 + (x2 - x1) * t + (Math.random() - 0.5) * 0.01,
          y1 + (y2 - y1) * t + (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
        );
      }
    };
    addLine(0, 1.35, -0.8, 0.8, 120);
    addLine(0, 1.35, 0.8, 0.8, 120);
    addLine(-0.8, 0.8, 0.8, 0.8, 120);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(points), 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.1 + position[0] * 0.5;
    groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.4 + position[0]) * 0.05;
  });

  return (
    <group ref={groupRef} position={position}>
      <points geometry={geometry}>
        <pointsMaterial
          color="#BF00FF"
          size={0.012}
          sizeAttenuation
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}


// --- Main scene ---
export default function MerchScene() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <WebGPUCanvas className="!fixed inset-0 z-0" dpr={isMobile ? [1, 1] : [1, 1.5]}>
      <Environment />
      <fog attach="fog" args={["#12101e", 18, 45]} />
      <ambientLight intensity={0.05} />
      <pointLight position={[0, 4, 4]} intensity={2.0} color="#BF00FF" distance={25} decay={2} />
      <pointLight position={[-3, 2, 3]} intensity={1.2} color="#00F0FF" distance={20} decay={2} />
      <pointLight position={[3, 0, 5]} intensity={0.8} color="#E619A0" distance={15} decay={2} />

      <ShowcaseBackground />
      <ScenePostProcessing />
    </WebGPUCanvas>
  );
}
