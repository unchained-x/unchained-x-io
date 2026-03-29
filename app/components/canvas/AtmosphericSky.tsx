import { useMemo } from "react";
import { BackSide, Color, Float32BufferAttribute, SphereGeometry } from "three";

/**
 * Cyberpunk sky dome with vertex-color gradient.
 * Top: dark purple/blue (slight glow from city lights above)
 * Horizon: black (blends with fog)
 * Works with WebGPURenderer via vertexColors.
 */
export default function AtmosphericSky() {
  const geometry = useMemo(() => {
    const geo = new SphereGeometry(80, 32, 32);
    const pos = geo.getAttribute("position");
    const colors = new Float32Array(pos.count * 3);

    const topColor = new Color("#12062a"); // dark purple
    const midColor = new Color("#0a0315"); // very dark purple
    const horizonColor = new Color("#020102"); // near black
    const tempColor = new Color();

    for (let i = 0; i < pos.count; i++) {
      // Normalized height: -1 (bottom) to 1 (top)
      const y = pos.getY(i);
      const normalizedY = y / 80;

      if (normalizedY > 0.1) {
        // Upper sky: dark purple
        const t = Math.min(1, (normalizedY - 0.1) / 0.9);
        tempColor.copy(midColor).lerp(topColor, t);
      } else if (normalizedY > -0.1) {
        // Horizon band: fade to black
        const t = (normalizedY + 0.1) / 0.2;
        tempColor.copy(horizonColor).lerp(midColor, t);
      } else {
        // Below horizon: black
        tempColor.copy(horizonColor);
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
    return geo;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial vertexColors side={BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
}
