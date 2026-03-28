import { abs, color, cos, float, mix, sin, smoothstep, uniform, uv, vec3 } from "three/tsl";

/**
 * Procedural electric arc / lightning shader.
 * Used for flash effects and transitions.
 * Renders on a plane — UV-based.
 */
export function createElectricArcMaterial() {
  const uTime = uniform(0.0);
  const uIntensity = uniform(1.0);
  const uThickness = uniform(0.02);

  const arcColor = color("#00F0FF");
  const flashColor = color("#FFFFFF");

  // UV centered at 0
  const centeredUV = uv().sub(0.5);

  // Generate jagged line along x-axis using layered sine waves
  const noise1 = sin(centeredUV.x.mul(40.0).add(uTime.mul(15.0))).mul(0.08);
  const noise2 = sin(centeredUV.x.mul(80.0).add(uTime.mul(25.0))).mul(0.04);
  const noise3 = cos(centeredUV.x.mul(120.0).add(uTime.mul(35.0))).mul(0.02);

  const arcY = noise1.add(noise2).add(noise3);

  // Distance from arc line
  const dist = abs(centeredUV.y.sub(arcY));

  // Core brightness
  const core = smoothstep(uThickness, float(0.0), dist);

  // Outer glow
  const glow = smoothstep(uThickness.mul(8.0), float(0.0), dist).mul(0.4);

  const brightness = core.add(glow).mul(uIntensity);
  const finalColor = mix(arcColor, flashColor, core.mul(0.6));

  return {
    colorNode: vec3(finalColor.mul(brightness)),
    opacityNode: brightness,
    uniforms: { uTime, uIntensity, uThickness },
  };
}
