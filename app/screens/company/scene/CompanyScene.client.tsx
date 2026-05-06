import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
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

// --- Company background — bright, clean, authoritative ---
function CompanyBackground() {
  const uTime = useMemo(() => uniform(0.0), []);

  const colorNode = useMemo(() => {
    const p = positionLocal;
    const t = uTime;

    // Bright palette — dark blue base
    const darkBase = color("#0a0e1e");
    const midBase = color("#121830");
    const brightBase = color("#1a2240");
    const heightMix = p.y.div(30).add(0.5);

    // Primary noise
    const ni1 = vec2(p.x.mul(0.2).add(t.mul(0.1)), p.z.mul(0.2).add(p.y.mul(0.1)).add(t.mul(0.08)));
    const n1 = fbmFn(ni1);

    const ni2 = vec2(p.z.mul(0.18).sub(t.mul(0.08)), p.y.mul(0.18).add(p.x.mul(0.12)).sub(t.mul(0.07)));
    const n2 = fbmFn(ni2);

    // Domain warping
    const warped = fbmFn(ni2.add(vec2(n1.mul(1.6), n1.mul(1.3))));

    const fog = n1.mul(0.35).add(warped.mul(0.65));
    const baseColor = mix(darkBase, mix(midBase, brightBase, fog), heightMix);

    // === UNIQUE: Prism dispersion — light splits into spectral bands ===
    // Diagonal "beam" direction — position projected onto a moving diagonal axis
    const beamAngle = t.mul(0.06);
    const beamAxis = p.x.mul(cos(beamAngle)).add(p.y.mul(sin(beamAngle))).mul(0.15);
    // Warp the beam with noise for organic feel
    const beamWarp = fbmFn(vec2(beamAxis.add(t.mul(0.05)), p.z.mul(0.1).add(warped.mul(1.5))));
    const beamPhase = beamAxis.add(beamWarp.mul(3.0)).add(t.mul(0.08));

    // Spectral separation — each color at a different phase offset (like a real prism)
    const redBand = sin(beamPhase.mul(4.0)).mul(0.5).add(0.5);
    const orangeBand = sin(beamPhase.mul(4.0).add(0.8)).mul(0.5).add(0.5);
    const cyanBand = sin(beamPhase.mul(4.0).add(1.6)).mul(0.5).add(0.5);
    const blueBand = sin(beamPhase.mul(4.0).add(2.4)).mul(0.5).add(0.5);
    const violetBand = sin(beamPhase.mul(4.0).add(3.2)).mul(0.5).add(0.5);

    // Combine into spectral color
    const prismColor = vec3(
      redBand.mul(0.8).add(orangeBand.mul(0.3)).add(violetBand.mul(0.5)),
      cyanBand.mul(0.7).add(orangeBand.mul(0.2)),
      blueBand.mul(0.8).add(violetBand.mul(0.6)).add(cyanBand.mul(0.3)),
    );

    // Mask — only visible in band regions, not everywhere
    const prismMask = beamWarp.sub(0.25).max(0).mul(3.0).min(1.0);
    const prismFinal = prismColor.mul(prismMask).mul(0.035);

    // Secondary refraction — smaller, faster, offset angle
    const refractAxis = p.x.mul(sin(beamAngle.add(1.2))).add(p.y.mul(cos(beamAngle.add(1.2)))).mul(0.25);
    const refractWarp = noiseFn(vec2(refractAxis.add(t.mul(0.12)), p.z.mul(0.15)));
    const refractPhase = refractAxis.add(refractWarp.mul(2.0)).add(t.mul(0.1));
    const refractColor = vec3(
      sin(refractPhase.mul(5.0)).mul(0.5).add(0.5).mul(0.6),
      sin(refractPhase.mul(5.0).add(2.0)).mul(0.5).add(0.5).mul(0.5),
      sin(refractPhase.mul(5.0).add(4.0)).mul(0.5).add(0.5).mul(0.8),
    );
    const refractMask = refractWarp.sub(0.35).max(0).mul(4.0).min(1.0);
    const refractFinal = refractColor.mul(refractMask).mul(0.02);

    // Diamond dust — fine, high-frequency shimmering particles instead of smooth haze
    const dust1 = noiseFn(vec2(p.x.mul(8.0).add(t.mul(0.6)), p.z.mul(8.0).sub(t.mul(0.4))));
    const dust2 = noiseFn(vec2(p.z.mul(7.0).add(t.mul(0.5)), p.y.mul(6.0).add(t.mul(0.35))));
    const dustMask = dust1.mul(dust2).sub(0.2).max(0).mul(3.0).min(1.0);
    // Animate brightness — twinkle
    const twinkle = sin(t.mul(3.0).add(p.x.mul(12.0))).mul(sin(t.mul(2.3).add(p.z.mul(10.0)))).mul(0.5).add(0.5);
    const dustColor = vec3(float(0.7), float(0.75), float(0.95)).mul(dustMask).mul(twinkle).mul(0.005);

    // Sparse bright flecks — larger, rarer, brighter
    const fleck = noiseFn(vec2(p.x.mul(3.0).add(t.mul(0.25)), p.z.mul(3.0).sub(t.mul(0.18)))).sub(0.93).max(0).mul(14.0);
    const fleckColor = vec3(float(0.95), float(0.95), float(1.0)).mul(fleck).mul(0.005);

    // Breathing
    const breathe = sin(t.mul(0.1)).mul(cos(t.mul(0.15))).mul(0.02).add(0.98);

    return baseColor.add(prismFinal).add(refractFinal).add(dustColor).add(fleckColor).mul(breathe);
  }, [uTime]);

  useFrame(({ clock }) => { uTime.value = clock.getElapsedTime(); });

  return (
    <mesh>
      <sphereGeometry args={[30, 12, 12]} />
      <meshBasicNodeMaterial colorNode={colorNode} side={1} />
    </mesh>
  );
}


// --- Main scene ---
export default function CompanyScene() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <WebGPUCanvas className="!fixed inset-0 z-0" dpr={isMobile ? [1, 1] : [1, 1.5]}>
      <Environment />
      <fog attach="fog" args={["#0a0e1e", 18, 45]} />
      <ambientLight intensity={0.08} />
      <pointLight position={[0, 4, 4]} intensity={2.0} color="#00F0FF" distance={25} decay={2} />
      <pointLight position={[-4, 2, 3]} intensity={1.2} color="#4060FF" distance={20} decay={2} />
      <pointLight position={[3, -1, 5]} intensity={0.8} color="#E0E0FF" distance={15} decay={2} />

      <CompanyBackground />
      <ScenePostProcessing />
    </WebGPUCanvas>
  );
}
