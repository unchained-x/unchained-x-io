import { Suspense } from "react";
import { type PBRSet, usePBRTextures } from "~/lib/pbrMaterial";

interface GroundProps {
  size?: number;
  yPos?: number;
  texture?: PBRSet;
  repeat?: [number, number];
  envMapIntensity?: number;
}

export default function Ground(props: GroundProps) {
  return (
    <Suspense fallback={null}>
      <GroundInner {...props} />
    </Suspense>
  );
}

function GroundInner({
  size = 100,
  yPos = -3,
  texture = "cs_concretepaintdarkold",
  repeat = [12, 12],
  envMapIntensity = 0.3,
}: GroundProps) {
  const textures = usePBRTextures(texture, repeat);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, yPos, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial {...textures} envMapIntensity={envMapIntensity} />
    </mesh>
  );
}
