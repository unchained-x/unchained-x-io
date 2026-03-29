import { Cloud } from "@react-three/drei";
import type { Vector3 } from "@react-three/fiber";
import { useMemo } from "react";

/**
 * Subtle neon smoke around text area.
 * Small and thin so buildings remain visible.
 */
export default function NeonClouds() {
  const clouds = useMemo(
    () => [
      // Dark wisp behind text for contrast
      {
        position: [0, 0.3, -0.5] as Vector3,
        opacity: 0.07,
        speed: 0.15,
        width: 8,
        depth: 1,
        segments: 5,
        color: "#0a0520",
      },
      // Cyan wisp
      {
        position: [-2, 1.5, 0] as Vector3,
        opacity: 0.04,
        speed: 0.1,
        width: 5,
        depth: 1,
        segments: 4,
        color: "#00F0FF",
      },
      // Purple wisp
      {
        position: [3, -0.5, 0] as Vector3,
        opacity: 0.04,
        speed: -0.12,
        width: 4,
        depth: 1,
        segments: 4,
        color: "#BF00FF",
      },
    ],
    [],
  );

  return (
    <>
      {clouds.map((props) => (
        <Cloud key={`cloud-${props.position[0]}-${props.position[1]}`} {...props} />
      ))}
    </>
  );
}
