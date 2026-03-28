import { Canvas } from "@react-three/fiber";

function TestMesh() {
  return (
    <mesh>
      <torusKnotGeometry args={[1, 0.3, 128, 32]} />
      <meshStandardMaterial color="#00F0FF" wireframe />
    </mesh>
  );
}

export default function Scene() {
  return (
    <Canvas
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%" }}
      camera={{ position: [0, 0, 5], fov: 50 }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <TestMesh />
    </Canvas>
  );
}
