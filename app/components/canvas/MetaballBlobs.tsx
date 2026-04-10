import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Mesh } from "three";
import {
  Break,
  Fn,
  If,
  Loop,
  abs,
  cos,
  dot,
  float,
  length,
  max,
  min,
  mix,
  normalize,
  pow,
  sin,
  uniform,
  uv,
  vec3,
  vec4,
} from "three/tsl";

/**
 * Raymarched metaballs with bubble-like transparency.
 * Only the blob surface is rendered — background is fully transparent.
 */
export default function MetaballBlobs() {
  const meshRef = useRef<Mesh>(null);
  const { size } = useThree();

  const { colorNode, uniforms } = useMemo(() => {
    const uTime = uniform(0.0);
    const uAspect = uniform(size.width / size.height);

    const sdSphere = Fn(([p, center, r]: [any, any, any]) => {
      return length(p.sub(center)).sub(r);
    });

    const smin = Fn(([a, b, k]: [any, any, any]) => {
      const h = max(k.sub(abs(a.sub(b))), float(0)).div(k);
      return min(a, b).sub(h.mul(h).mul(k).mul(0.25));
    });

    const sceneSDF = Fn(([p]: [any]) => {
      const t = uTime.mul(0.6);

      // Varied speed — accelerate/decelerate
      const sp1 = t.add(sin(t.mul(0.25)).mul(1.0));
      const sp2 = t.add(cos(t.mul(0.3).add(1.0)).mul(0.8));
      const sp3 = t.add(sin(t.mul(0.2).add(2.5)).mul(1.2));

      const e1 = vec3(
        sin(sp1.mul(0.7)).mul(1.3).add(sin(sp1.mul(1.5)).mul(0.2)),
        sin(sp1.mul(0.9)).mul(cos(sp1.mul(0.5))).mul(0.6).add(cos(sp1.mul(1.2)).mul(0.15)),
        cos(sp1.mul(0.5)).mul(0.8).add(sin(sp1.mul(1.1)).mul(0.15)),
      );
      const e2 = vec3(
        cos(sp2.mul(0.6)).mul(1.2).add(cos(sp2.mul(1.3)).mul(0.2)),
        cos(sp2.mul(0.7).add(2.0)).mul(sin(sp2.mul(0.45))).mul(0.7).add(sin(sp2.mul(1.4)).mul(0.1)),
        sin(sp2.mul(0.65)).mul(0.9).add(cos(sp2.mul(1.0)).mul(0.2)),
      );
      const e3 = vec3(
        sin(sp3.mul(0.8)).mul(1.1).add(sin(sp3.mul(1.2)).mul(0.25)),
        sin(sp3.mul(0.55).add(3.0)).mul(0.8).add(cos(sp3.mul(0.9)).mul(0.2)),
        cos(sp3.mul(0.7)).mul(0.7).add(sin(sp3.mul(1.3)).mul(0.15)),
      );

      const r1 = float(0.45).add(sin(t.mul(1.5)).mul(0.05));
      const r2 = float(0.42).add(cos(t.mul(1.3).add(1.0)).mul(0.04));
      const r3 = float(0.43).add(sin(t.mul(1.1).add(2.0)).mul(0.05));

      const b1 = mix(e1, e2, sin(t.mul(0.5)).mul(0.5).add(0.5));
      const b2 = mix(e2, e3, cos(t.mul(0.4).add(1.0)).mul(0.5).add(0.5));
      const b3 = mix(e3, e1, sin(t.mul(0.45).add(2.0)).mul(0.5).add(0.5));

      const distort = sin(p.x.mul(3.0).add(t)).mul(cos(p.y.mul(2.5).add(t.mul(0.7)))).mul(0.015);

      const d1 = sdSphere(p, e1, r1).add(distort);
      const d2 = sdSphere(p, e2, r2).add(distort);
      const d3 = sdSphere(p, e3, r3).add(distort);
      const db1 = sdSphere(p, b1, float(0.25));
      const db2 = sdSphere(p, b2, float(0.22));
      const db3 = sdSphere(p, b3, float(0.2));

      const k = float(0.25);
      const mainBlobs = smin(smin(d1, d2, k), d3, k);
      const bridges = smin(smin(db1, db2, float(0.2)), db3, float(0.2));
      return smin(mainBlobs, bridges, float(0.22));
    });

    const calcNormal = Fn(([p]: [any]) => {
      const e = float(0.002);
      return normalize(vec3(
        sceneSDF(p.add(vec3(e, 0, 0))).sub(sceneSDF(p.sub(vec3(e, 0, 0)))),
        sceneSDF(p.add(vec3(0, e, 0))).sub(sceneSDF(p.sub(vec3(0, e, 0)))),
        sceneSDF(p.add(vec3(0, 0, e))).sub(sceneSDF(p.sub(vec3(0, 0, e)))),
      ));
    });

    const raymarch = Fn(() => {
      const uvCoord = uv().sub(0.5);
      const ro = vec3(0, 0, 3.5);
      const rd = normalize(vec3(uvCoord.x.mul(uAspect).mul(2.0), uvCoord.y.mul(2.0), float(-1.5)));

      const resultColor = vec3(0, 0, 0).toVar();
      const resultAlpha = float(0).toVar();
      const t = float(0).toVar();

      Loop(20, () => {
        const p = ro.add(rd.mul(t));
        const d = sceneSDF(p);

        If(d.lessThan(0.002), () => {
          const n = calcNormal(p);
          const lDir = normalize(vec3(2, 3, 2));

          // Bubble shading with more light
          const lDir2 = normalize(vec3(-1, 2, 1));
          const diff = max(dot(n, lDir), float(0)).mul(0.25);
          const diff2 = max(dot(n, lDir2), float(0)).mul(0.15);
          const hDir = normalize(lDir.sub(rd));
          const spec = pow(max(dot(n, hDir), float(0)), float(60)).mul(0.7);
          const hDir2 = normalize(lDir2.sub(rd));
          const spec2 = pow(max(dot(n, hDir2), float(0)), float(40)).mul(0.3);
          const ndotv = max(dot(n, rd.negate()), float(0));
          const fresnel = pow(float(1).sub(ndotv), float(3));

          // Position-based color tint — cyan to purple gradient across blobs
          const tintMix = sin(p.x.mul(1.2).add(p.y.mul(0.8)).add(uTime.mul(0.3))).mul(0.5).add(0.5);
          const cyanTint = vec3(0.0, 0.94, 1.0);
          const purpleTint = vec3(0.75, 0.0, 1.0);
          const tintColor = mix(cyanTint, purpleTint, tintMix);

          // Bubble base with neon tint blended in
          const bubbleColor = mix(vec3(0.63, 0.85, 0.91), tintColor, float(0.35));
          const emissiveColor = mix(vec3(0.5, 0.75, 0.82), tintColor, float(0.25));

          // Light color tinting — cyan from main light, purple from fill
          const cyanLight = vec3(0.0, 0.94, 1.0).mul(diff).mul(0.15);
          const purpleLight = vec3(0.75, 0.0, 1.0).mul(diff2).mul(0.25);

          const color = bubbleColor.mul(diff.add(diff2)).add(emissiveColor.mul(0.2)).add(cyanLight).add(purpleLight).add(tintColor.mul(fresnel).mul(0.1)).add(vec3(1, 1, 1).mul(spec.add(spec2)));
          const edgeHighlight = vec3(0.9, 0.95, 1.0).mul(fresnel).mul(0.25);

          resultColor.assign(color.add(edgeHighlight));
          // Alpha: transparent center, visible edges (like a real bubble)
          resultAlpha.assign(float(0.25).add(fresnel.mul(0.45)));

          Break();
        });

        If(t.greaterThan(10), () => { Break(); });
        t.addAssign(d);
      });

      return vec4(resultColor, resultAlpha);
    });

    return { colorNode: raymarch(), uniforms: { uTime, uAspect } };
  }, [size.width, size.height]);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uAspect.value = size.width / size.height;
    if (meshRef.current) meshRef.current.frustumCulled = false;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -3]}>
      <planeGeometry args={[14, 9]} />
      <meshBasicNodeMaterial colorNode={colorNode} transparent depthWrite={false} />
    </mesh>
  );
}
