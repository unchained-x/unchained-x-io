import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { emissive, mrt, output, pass, vec4 } from "three/tsl";
import * as THREE from "three/webgpu";

interface NativePostProcessingProps {
  bloomStrength?: number;
  bloomRadius?: number;
  toneMappingExposure?: number;
}

/**
 * Integrates Three.js native WebGPU post-processing (bloom via MRT)
 * with React Three Fiber's render loop.
 */
export default function NativePostProcessing({
  bloomStrength = 2.5,
  bloomRadius = 0.5,
  toneMappingExposure = 1.2,
}: NativePostProcessingProps) {
  const { gl, scene, camera } = useThree();
  const pipelineRef = useRef<THREE.RenderPipeline | null>(null);
  const bloomPassRef = useRef<ReturnType<typeof bloom> | null>(null);

  useEffect(() => {
    const renderer = gl as unknown as THREE.WebGPURenderer;

    // Configure tone mapping
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = toneMappingExposure;

    // Create scene pass
    const scenePass = pass(scene, camera);

    // MRT: separate output and emissive channels
    const mrtNode = mrt({
      output: output,
      emissive: vec4(emissive, output.a),
    });
    scenePass.setMRT(mrtNode);

    // Optimize emissive texture bandwidth
    const emissiveTexture = scenePass.getTexture("emissive");
    emissiveTexture.type = THREE.UnsignedByteType;

    // Get texture nodes
    const outputPass = scenePass.getTextureNode();
    const emissivePass = scenePass.getTextureNode("emissive");

    // Create bloom on emissive channel only
    const bloomNode = bloom(emissivePass, bloomStrength, bloomRadius);
    bloomPassRef.current = bloomNode;

    // Create render pipeline
    const pipeline = new THREE.RenderPipeline(renderer);
    pipeline.outputNode = outputPass.add(bloomNode);
    pipelineRef.current = pipeline;

    return () => {
      pipelineRef.current = null;
      bloomPassRef.current = null;
    };
  }, [gl, scene, camera, bloomStrength, bloomRadius, toneMappingExposure]);

  // Override R3F's render loop — use our pipeline instead
  useFrame(() => {
    if (pipelineRef.current) {
      pipelineRef.current.renderAsync();
      return;
    }
  }, 1); // priority 1 = runs after default

  return null;
}
