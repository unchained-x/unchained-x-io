import { Html, useGLTF } from "@react-three/drei";
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

// --- Forest background ---
function ForestBackground() {
  const uTime = useMemo(() => uniform(0.0), []);

  const colorNode = useMemo(() => {
    const p = positionLocal;
    const t = uTime;

    // Forest palette
    const deepVoid = color("#050e0a");
    const darkForest = color("#0a1e15");
    const midForest = color("#122e20");
    const heightMix = p.y.div(30).add(0.5);

    // === UNIQUE: Vertically-stretched noise — trees are tall ===
    // X is compressed, Y is stretched — creates vertical grain
    const treeNoise1 = fbmFn(vec2(p.x.mul(0.5).add(t.mul(0.08)), p.y.mul(0.12).add(p.z.mul(0.15)).add(t.mul(0.05))));
    const treeNoise2 = fbmFn(vec2(p.z.mul(0.45).sub(t.mul(0.06)), p.y.mul(0.1).add(p.x.mul(0.15)).sub(t.mul(0.07))));

    // === UNIQUE: Parallax depth layers — 3 forest planes at different speeds ===
    // Far layer — slow, large shapes (distant trees)
    const farLayer = fbmFn(vec2(p.x.mul(0.12).add(t.mul(0.04)), p.y.mul(0.06).add(t.mul(0.02))));
    // Mid layer — medium speed (mid-ground canopy)
    const midLayer = fbmFn(vec2(p.x.mul(0.25).add(t.mul(0.12)), p.y.mul(0.1).add(t.mul(0.08))));
    // Near layer — fast, fine detail (close branches swaying)
    const nearLayer = fbmFn(vec2(p.x.mul(0.5).add(t.mul(0.25)), p.y.mul(0.15).add(t.mul(0.18))));

    // Domain warp with vertical bias
    const warped = fbmFn(vec2(
      p.x.mul(0.3).add(treeNoise1.mul(2.0)).add(t.mul(0.1)),
      p.y.mul(0.08).add(treeNoise2.mul(1.5)).sub(t.mul(0.06)),
    ));

    // Blend layers with depth
    const fog = farLayer.mul(0.2).add(midLayer.mul(0.35)).add(nearLayer.mul(0.15)).add(warped.mul(0.3));
    const baseColor = mix(deepVoid, mix(darkForest, midForest, fog), heightMix);

    // === UNIQUE: Dappled light — small irregular bright patches moving through canopy ===
    // High-frequency noise creates small circles of light
    const dappleInput = vec2(
      p.x.mul(1.2).add(sin(t.mul(0.15)).mul(0.8)).add(nearLayer.mul(1.5)),
      p.y.mul(0.6).add(cos(t.mul(0.12)).mul(0.6)).add(midLayer.mul(1.2)),
    );
    const dappleNoise = noiseFn(dappleInput);
    // Sharp threshold — either light or shadow, not smooth
    const dappleMask = smoothstep(float(0.52), float(0.58), dappleNoise);
    // Only in upper half (light comes from above)
    const dappleHeight = smoothstep(float(0.3), float(0.7), p.y.div(30).add(0.5));
    const dappleColor = vec3(float(0.05), float(0.7), float(0.4)).mul(dappleMask).mul(dappleHeight).mul(0.09);

    // === UNIQUE: Branching tendrils — recursive warp creates vein-like patterns ===
    const branchInput = vec2(
      p.x.mul(0.8).add(warped.mul(3.0)),
      p.y.mul(0.2).add(treeNoise1.mul(2.5)),
    );
    const branchNoise = fbmFn(branchInput);
    // Narrow bands = branch-like lines
    const branchMask = sin(branchNoise.mul(12.0)).mul(0.5).add(0.5);
    const branchThin = smoothstep(float(0.45), float(0.55), branchMask);
    const branchColor = vec3(float(0.0), float(0.4), float(0.25)).mul(branchThin).mul(0.05);

    // Cyan bioluminescence in deep areas
    const bioGlow = vec3(float(0.0), float(0.65), float(0.55)).mul(warped.sub(0.35).max(0).mul(3.0)).mul(0.06);

    // Purple shadow in recesses
    const purpleShadow = vec3(float(0.25), float(0.0), float(0.35)).mul(treeNoise2.sub(0.3).max(0).mul(2.5)).mul(0.07);

    // Fireflies — pulsing
    const fireflyPhase = sin(t.mul(2.0).add(p.x.mul(7.0)).add(p.z.mul(5.0))).mul(0.5).add(0.5);
    const fireflyMask = noiseFn(vec2(p.x.mul(5.0).add(t.mul(0.5)), p.z.mul(5.0).sub(t.mul(0.3)))).sub(0.93).max(0).mul(14.0);
    const sparkleColor = vec3(float(0.3), float(1.0), float(0.5)).mul(fireflyMask).mul(fireflyPhase).mul(0.07);

    // Forest breathes
    const breathe = sin(t.mul(0.13)).mul(cos(t.mul(0.19))).mul(0.03).add(0.97);

    return baseColor.add(dappleColor).add(branchColor).add(bioGlow).add(purpleShadow).add(sparkleColor).mul(breathe);
  }, [uTime]);

  useFrame(({ clock }) => { uTime.value = clock.getElapsedTime(); });

  return (
    <mesh>
      <sphereGeometry args={[30, 12, 12]} />
      <meshBasicNodeMaterial colorNode={colorNode} side={1} />
    </mesh>
  );
}

// --- Shared: extract point cloud from GLB model ---
const IS_MOBILE = typeof window !== "undefined" && window.innerWidth < 768;

function useModelPointCloud(modelPath: string, surfaceSample = false) {
  const { scene: gltfScene } = useGLTF(modelPath);

  const { positions, colors, count, hasColors } = useMemo(() => {
    const allPositions: number[] = [];
    gltfScene.updateMatrixWorld(true);

    if (surfaceSample) {
      // Uniform surface sampling for smooth models (egg etc.)
      const SAMPLE_COUNT = IS_MOBILE ? 3000 : 8000;
      const triangles: { a: THREE.Vector3; b: THREE.Vector3; c: THREE.Vector3; area: number }[] = [];
      let totalArea = 0;

      gltfScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const geo = mesh.geometry;
          const pos = geo.attributes.position;
          const idx = geo.index;
          const matrix = mesh.matrixWorld;

          const getVertex = (i: number) => {
            const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
            v.applyMatrix4(matrix);
            return v;
          };

          const triCount = idx ? idx.count / 3 : pos.count / 3;
          for (let t = 0; t < triCount; t++) {
            const i0 = idx ? idx.getX(t * 3) : t * 3;
            const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
            const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
            const a = getVertex(i0);
            const b = getVertex(i1);
            const c = getVertex(i2);
            const ab = new THREE.Vector3().subVectors(b, a);
            const ac = new THREE.Vector3().subVectors(c, a);
            const area = ab.cross(ac).length() * 0.5;
            triangles.push({ a, b, c, area });
            totalArea += area;
          }
        }
      });

      for (let s = 0; s < SAMPLE_COUNT; s++) {
        let r = Math.random() * totalArea;
        for (const tri of triangles) {
          r -= tri.area;
          if (r <= 0) {
            let u = Math.random();
            let v = Math.random();
            if (u + v > 1) { u = 1 - u; v = 1 - v; }
            allPositions.push(
              tri.a.x + (tri.b.x - tri.a.x) * u + (tri.c.x - tri.a.x) * v,
              tri.a.y + (tri.b.y - tri.a.y) * u + (tri.c.y - tri.a.y) * v,
              tri.a.z + (tri.b.z - tri.a.z) * u + (tri.c.z - tri.a.z) * v,
            );
            break;
          }
        }
      }
    } else {
      // Direct vertex extraction (preserves model detail like wolf)
      gltfScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const geo = mesh.geometry;
          const pos = geo.attributes.position;
          const matrix = mesh.matrixWorld;
          for (let i = 0; i < pos.count; i++) {
            const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
            v.applyMatrix4(matrix);
            allPositions.push(v.x, v.y, v.z);
          }
        }
      });
    }

    return {
      positions: new Float32Array(allPositions),
      colors: new Float32Array(0),
      count: allPositions.length / 3,
      hasColors: false,
    };
  }, [gltfScene]);

  const { centerOffset, autoScale } = useMemo(() => {
    const box = new THREE.Box3();
    for (let i = 0; i < count; i++) {
      box.expandByPoint(new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]));
    }
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    return {
      centerOffset: [-center.x, -center.y, -center.z] as [number, number, number],
      autoScale: maxDim > 0 ? 3.0 / maxDim : 1,
    };
  }, [positions, count]);

  const displayPositions = useMemo(() => new Float32Array(positions), [positions]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(displayPositions, 3));
    return geo;
  }, [displayPositions, hasColors, colors]);

  return { positions, colors, count, hasColors, centerOffset, autoScale, geometry };
}

// --- Animal point cloud (wolf, egg, etc.) with click animation ---
function AnimalPointCloud({ modelPath, mouseRef, scaleMultiplier = 1, surfaceSample = false }: { modelPath: string; mouseRef: React.RefObject<{ x: number; y: number }>; scaleMultiplier?: number; surfaceSample?: boolean }) {
  const { positions, count, hasColors, centerOffset, autoScale, geometry } = useModelPointCloud(modelPath, surfaceSample);
  const groupRef = useRef<Group>(null);
  const mainMatRef = useRef<THREE.PointsMaterial>(null);
  const shedMatRef = useRef<THREE.PointsMaterial>(null);

  // Click animation state
  const clickAnim = useRef({ active: false, time: 0 });

  // Explode offsets — random direction per vertex for scatter
  const explodeOffsets = useMemo(() => {
    const offsets = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.15 + Math.random() * 0.25;
      offsets[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      offsets[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      offsets[i * 3 + 2] = Math.cos(phi) * r;
    }
    return offsets;
  }, [count]);

  // Working positions buffer (modified during animation)
  const workingPositions = useMemo(() => new Float32Array(positions), [positions]);

  // Shedding particles
  const sheddingGeo = useMemo(() => {
    const num = 40;
    const pos = new Float32Array(num * 3);
    const vel = new Float32Array(num * 3);
    const life = new Float32Array(num);
    for (let i = 0; i < num; i++) {
      const vi = Math.floor(Math.random() * count);
      pos[i * 3] = positions[vi * 3];
      pos[i * 3 + 1] = positions[vi * 3 + 1];
      pos[i * 3 + 2] = positions[vi * 3 + 2];
      vel[i * 3] = (Math.random() - 0.5) * 0.015;
      vel[i * 3 + 1] = Math.random() * 0.008 + 0.003;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.015;
      life[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.userData = { velocities: vel, lifetimes: life };
    return geo;
  }, [positions, count]);

  const handleClick = () => {
    clickAnim.current = { active: true, time: 0 };
  };

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const anim = clickAnim.current;

    if (groupRef.current) {
      // Breathing
      const breath = Math.sin(t * 0.8) * 0.015 + 1.0;
      const s = autoScale * breath * scaleMultiplier;
      groupRef.current.scale.set(s, s, s);

      // Gaze follows cursor
      if (mouseRef.current) {
        const targetRotY = mouseRef.current.x * 0.25;
        const targetRotX = -mouseRef.current.y * 0.12;
        groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.04;
        groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.04;
      }
    }

    // Click: explode + color flash
    if (anim.active) {
      anim.time += delta;
      const duration = 1.4;
      const progress = Math.min(anim.time / duration, 1);

      // Slow ease in, slow ease out — very fluid
      const scatter = Math.sin(progress * Math.PI);

      // Update point positions with spiral scatter
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const spiralAngle = scatter * Math.PI * 4; // 2 full rotations
      for (let i = 0; i < count; i++) {
        const ox = explodeOffsets[i * 3] * scatter;
        const oz = explodeOffsets[i * 3 + 2] * scatter;
        // Rotate offset around Y axis for spiral
        const cosA = Math.cos(spiralAngle);
        const sinA = Math.sin(spiralAngle);
        arr[i * 3] = positions[i * 3] + ox * cosA - oz * sinA;
        arr[i * 3 + 1] = positions[i * 3 + 1] + explodeOffsets[i * 3 + 1] * scatter;
        arr[i * 3 + 2] = positions[i * 3 + 2] + ox * sinA + oz * cosA;
      }
      posAttr.needsUpdate = true;

      // Color flash: cyan → magenta → cyan
      const flashIntensity = Math.sin(progress * Math.PI);
      const r = flashIntensity * 0.9;
      const g = (1 - flashIntensity) * 0.94;
      const b = 1.0;
      if (mainMatRef.current) mainMatRef.current.color.setRGB(r, g, b);
      if (shedMatRef.current) shedMatRef.current.color.setRGB(r, g, b);

      if (progress >= 1) {
        anim.active = false;
        if (mainMatRef.current) mainMatRef.current.color.set("#00F0FF");
        if (shedMatRef.current) shedMatRef.current.color.set("#00F0FF");
        // Restore original positions
        const posAttr2 = geometry.attributes.position as THREE.BufferAttribute;
        (posAttr2.array as Float32Array).set(positions);
        posAttr2.needsUpdate = true;
      }
    }

    // Shedding update
    const pos = sheddingGeo.attributes.position as THREE.BufferAttribute;
    const vel = sheddingGeo.userData.velocities as Float32Array;
    const life = sheddingGeo.userData.lifetimes as Float32Array;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < life.length; i++) {
      life[i] -= 0.004;
      if (life[i] <= 0) {
        const vi = Math.floor(Math.random() * count);
        arr[i * 3] = positions[vi * 3];
        arr[i * 3 + 1] = positions[vi * 3 + 1];
        arr[i * 3 + 2] = positions[vi * 3 + 2];
        vel[i * 3] = (Math.random() - 0.5) * 0.015;
        vel[i * 3 + 1] = Math.random() * 0.008 + 0.003;
        vel[i * 3 + 2] = (Math.random() - 0.5) * 0.015;
        life[i] = 0.8 + Math.random() * 0.2;
      }
      arr[i * 3] += vel[i * 3];
      arr[i * 3 + 1] += vel[i * 3 + 1];
      arr[i * 3 + 2] += vel[i * 3 + 2];
    }
    pos.needsUpdate = true;
  });

  return (
    <group ref={groupRef} position={centerOffset}>
      {/* Invisible mesh for click detection */}
      <mesh onClick={handleClick}>
        <sphereGeometry args={[3, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <points geometry={geometry}>
        <pointsMaterial
          ref={mainMatRef}
          color="#00F0FF"
          size={0.02}
          sizeAttenuation
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points geometry={sheddingGeo}>
        <pointsMaterial
          ref={shedMatRef}
          color="#00F0FF"
          size={0.012}
          sizeAttenuation
          transparent
          opacity={0.25}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// --- Member carousel (one member at a time, centered) ---
export interface MemberInfo {
  name: string;
  role: string;
  animal: string;
  isHiring?: boolean;
  links?: { twitter?: string; github?: string; website?: string };
}

const ANIMAL_MODELS: Record<string, string> = {
  wolf: "/models/wolf.glb",
  egg: "/models/egg.glb",
};

const ANIMAL_SCALES: Record<string, number> = {
  wolf: 1,
  egg: 0.7,
};

function MemberModel({ member, mouseRef }: { member: MemberInfo; mouseRef: React.RefObject<{ x: number; y: number }> }) {
  const modelPath = ANIMAL_MODELS[member.animal];
  if (!modelPath) return null;
  return <AnimalPointCloud modelPath={modelPath} mouseRef={mouseRef} scaleMultiplier={ANIMAL_SCALES[member.animal] ?? 1} surfaceSample={member.animal === "egg"} />;
}

function MemberCarousel({ members, currentIndex, mouseRef }: { members: MemberInfo[]; currentIndex: number; mouseRef: React.RefObject<{ x: number; y: number }> }) {
  const groupRef = useRef<Group>(null);
  const spacing = 6;

  useFrame(() => {
    if (!groupRef.current) return;
    const targetX = -currentIndex * spacing;
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.08;
  });

  return (
    <group ref={groupRef}>
      {members.map((member, i) => (
        <group key={member.name} position={[i * spacing, 0, 0]}>
          <MemberModel member={member} mouseRef={mouseRef} />
        </group>
      ))}
    </group>
  );
}


// --- Exported scene ---
interface TeamSceneProps {
  members: MemberInfo[];
  currentIndex: number;
}

export default function TeamScene({ members, currentIndex }: TeamSceneProps) {
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <WebGPUCanvas className="!fixed inset-0 z-0" dpr={isMobile ? [1, 1] : [1, 1.5]}>
      <Environment />
      <fog attach="fog" args={["#040f0d", 18, 45]} />
      <ambientLight intensity={0.05} />
      <pointLight position={[2, 5, 4]} intensity={2.0} color="#00F0FF" distance={25} decay={2} />
      <pointLight position={[-3, 2, 3]} intensity={1.0} color="#00FF78" distance={15} decay={2} />
      <pointLight position={[0, -1, 5]} intensity={0.8} color="#BF00FF" distance={15} decay={2} />

      <ForestBackground />
      <MemberCarousel members={members} currentIndex={currentIndex} mouseRef={mouseRef} />
      <ScenePostProcessing />
    </WebGPUCanvas>
  );
}

useGLTF.preload("/models/wolf.glb");
useGLTF.preload("/models/egg.glb");
