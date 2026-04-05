import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import AtmosphericParticles from "~/components/canvas/AtmosphericParticles";
import GlitchText from "~/components/canvas/GlitchText";

interface ValueWorldProps {
  visibility: number;
}

/**
 * Value section: "We undertake extraordinary complexity fundamentally and structurally."
 *
 * Visual: Energy converging to center. Radiating light.
 * Warm + cyan mix. Structured, powerful.
 */
export default function ValueWorld({ visibility }: ValueWorldProps) {
  const groupRef = useRef<Group>(null);
  const ringsRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // Rings rotate at different speeds
    if (ringsRef.current) {
      const children = ringsRef.current.children;
      for (let i = 0; i < children.length; i++) {
        children[i].rotation.x = t * (0.1 + i * 0.05);
        children[i].rotation.y = t * (0.15 + i * 0.03);
        children[i].rotation.z = t * (0.05 + i * 0.07);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Background */}
      <mesh>
        <sphereGeometry args={[30, 16, 16]} />
        <meshBasicMaterial color="#06020f" side={1} />
      </mesh>

      {/* Warm + cyan lighting */}
      <ambientLight intensity={0.03} />
      <pointLight position={[0, 0, 5]} intensity={4} color="#00F0FF" distance={30} decay={2} />
      <pointLight position={[4, 4, -3]} intensity={2.5} color="#FF4500" distance={20} decay={2} />
      <pointLight position={[-4, -3, -2]} intensity={2} color="#BF00FF" distance={20} decay={2} />
      <pointLight position={[0, 6, 0]} intensity={1.5} color="#E0E0FF" distance={25} decay={2} />

      {/* Concentric rings — energy structure */}
      <group ref={ringsRef}>
        {[1.5, 2.5, 3.5, 4.5].map((radius, i) => (
          <mesh key={`ring-${radius}`}>
            <torusGeometry args={[radius, 0.02, 8, 64]} />
            <meshStandardMaterial
              color="#050505"
              emissive={i % 2 === 0 ? "#00F0FF" : "#BF00FF"}
              emissiveIntensity={0.5}
              metalness={0.9}
              roughness={0.1}
              transparent
              opacity={0.7}
            />
          </mesh>
        ))}
      </group>

      {/* Central glowing sphere */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#00F0FF"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>

      {/* Particles converging */}
      <AtmosphericParticles
        count={100}
        color="#00F0FF"
        size={0.01}
        speed={0.05}
        area={[12, 12, 12]}
      />
      <AtmosphericParticles
        count={60}
        color="#FF4500"
        size={0.008}
        speed={0.04}
        area={[10, 10, 10]}
      />

      {/* Text */}
      {visibility > 0.05 && (
        <>
          <GlitchText
            position={[0, 5, 0]}
            size={0.2}
            depth={0.025}
            emissiveColor="#00F0FF"
            emissiveIntensity={1.3}
            glitchIntensity={0.5}
          >
            What We Deliver
          </GlitchText>
          {visibility > 0.15 && (
            <>
              <GlitchText
                position={[0, -4, 0]}
                size={0.055}
                depth={0.006}
                emissiveIntensity={0.8}
                glitchIntensity={0.1}
              >
                We undertake extraordinary complexity
              </GlitchText>
              <GlitchText
                position={[0, -4.6, 0]}
                size={0.055}
                depth={0.006}
                emissiveIntensity={0.8}
                glitchIntensity={0.1}
              >
                fundamentally and structurally.
              </GlitchText>
            </>
          )}
        </>
      )}
    </group>
  );
}
