import { color, float, mix, normalView, positionViewDirection, pow, sin, uniform } from "three/tsl";

/**
 * Fresnel glow shader for chain links.
 * Emits neon cyan at edges, pulses over time.
 */
export function createFresnelGlowMaterial() {
  const uTime = uniform(0.0);
  const uIntensity = uniform(1.0);
  const uPulseSpeed = uniform(2.0);

  const baseColor = color("#000000");
  const glowColor = color("#00F0FF");

  // Fresnel: brighter at edges
  const fresnel = pow(float(1.0).sub(normalView.dot(positionViewDirection).abs()), 2.0);

  // Pulse over time
  const pulse = sin(uTime.mul(uPulseSpeed)).mul(0.3).add(0.7);

  // Final color: base + glow * fresnel * pulse * intensity
  const finalColor = mix(baseColor, glowColor, fresnel.mul(pulse).mul(uIntensity));

  return {
    colorNode: finalColor,
    uniforms: { uTime, uIntensity, uPulseSpeed },
  };
}
