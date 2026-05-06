import { useGLTF } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import { Box3, Vector3 } from "three";

interface BackgroundCityProps {
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}

export default function BackgroundCity(props: BackgroundCityProps) {
  return (
    <Suspense fallback={null}>
      <BackgroundCityInner {...props} />
    </Suspense>
  );
}

function BackgroundCityInner({
  position = [0, -3, -10],
  scale = 0.5,
  rotation = [0, 0, 0],
}: BackgroundCityProps) {
  const { scene } = useGLTF("/models/cyberstreets-bg.glb");

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const box = new Box3().setFromObject(clone);
    const center = new Vector3();
    box.getCenter(center);
    // Center X and Z only — keep Y (height) at bottom of bounding box
    // so buildings sit ON the ground, not buried in it
    clone.position.set(-center.x, -box.min.y, -center.z);
    return clone;
  }, [scene]);

  return (
    <group position={position} scale={scale} rotation={rotation}>
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload("/models/cyberstreets-bg.glb");
