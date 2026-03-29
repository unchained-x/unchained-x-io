import { useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import type { Mesh } from "three";
import { type PBRSet, usePBRTextures } from "~/lib/pbrMaterial";

export type ObjectType = "blob" | "crystal" | "gear" | "torus" | "dnaNode";

// Map object types to PBR material sets + emissive colors
const OBJECT_CONFIG: Record<
  ObjectType,
  { pbr: PBRSet; emissive: string; repeat: [number, number] }
> = {
  blob: { pbr: "oxidized_steel", emissive: "#00F0FF", repeat: [2, 2] },
  crystal: { pbr: "brass", emissive: "#BF00FF", repeat: [1, 1] },
  gear: { pbr: "steel_galvanized", emissive: "#E0E0FF", repeat: [3, 3] },
  torus: { pbr: "metal_dark", emissive: "#00F0FF", repeat: [2, 1] },
  dnaNode: { pbr: "brass", emissive: "#BF00FF", repeat: [1, 1] },
};

interface LivingObjectProps {
  type: ObjectType;
  position: [number, number, number];
  scale?: number;
  noiseAmplitude?: number;
  index: number;
}

export default function LivingObject(props: LivingObjectProps) {
  return (
    <Suspense fallback={null}>
      <LivingObjectInner {...props} />
    </Suspense>
  );
}

function LivingObjectInner({ type, position, scale = 1, index }: LivingObjectProps) {
  const meshRef = useRef<Mesh>(null);
  const config = OBJECT_CONFIG[type];
  const textures = usePBRTextures(config.pbr, config.repeat);

  const basePos = useRef(position);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const p = index * 1.7;

    // Rotation — all axes, unique per object
    meshRef.current.rotation.x += Math.sin(t * 0.3 + p) * 0.005;
    meshRef.current.rotation.y += Math.cos(t * 0.25 + p * 0.7) * 0.006;
    meshRef.current.rotation.z += Math.sin(t * 0.35 + p * 1.3) * 0.004;

    // Position drift — irregular, unique orbits
    meshRef.current.position.x = basePos.current[0] + Math.sin(t * 0.2 + p) * 0.4;
    meshRef.current.position.y =
      basePos.current[1] + Math.cos(t * 0.15 + p * 0.6) * 0.3 + Math.sin(t * 0.4 + p * 2) * 0.15;
    meshRef.current.position.z = basePos.current[2] + Math.sin(t * 0.18 + p * 0.9) * 0.25;
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <ObjectGeometry type={type} />
      <meshStandardMaterial
        {...textures}
        emissive={config.emissive}
        emissiveIntensity={0.25}
        transparent
        opacity={0.9}
        wireframe={type === "crystal"}
        envMapIntensity={1.5}
      />
    </mesh>
  );
}

function ObjectGeometry({ type }: { type: ObjectType }) {
  switch (type) {
    case "blob":
      return <sphereGeometry args={[0.5, 32, 32]} />;
    case "crystal":
      return <icosahedronGeometry args={[0.5, 0]} />;
    case "gear":
      return <torusGeometry args={[0.4, 0.15, 8, 6]} />;
    case "torus":
      return <torusGeometry args={[0.35, 0.08, 16, 32]} />;
    case "dnaNode":
      return <sphereGeometry args={[0.12, 12, 12]} />;
    default:
      return <sphereGeometry args={[0.3, 16, 16]} />;
  }
}
