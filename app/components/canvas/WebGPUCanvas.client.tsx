import { Canvas, extend, type ThreeToJSXElements } from "@react-three/fiber";
import type { FC, PropsWithChildren } from "react";
import type { WebGPURendererParameters } from "three/src/renderers/webgpu/WebGPURenderer.js";
import * as THREE from "three/webgpu";

declare module "@react-three/fiber" {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

extend(THREE as unknown as Record<string, unknown>);

type Props = PropsWithChildren<{
  className?: string;
  dpr?: number | [number, number];
  /** Set to "never" when using native PostProcessing (it manages its own render) */
  frameloop?: "always" | "demand" | "never";
}>;

const WebGPUCanvas: FC<Props> = ({ children, className, dpr, frameloop = "always" }) => {
  return (
    <Canvas
      className={className}
      dpr={dpr ?? [1, 2]}
      frameloop={frameloop}
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer({
          ...(props as WebGPURendererParameters),
          antialias: true,
        });
        await renderer.init();
        return renderer;
      }}
    >
      {children}
    </Canvas>
  );
};

export default WebGPUCanvas;
