import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import {
  emissive,
  float,
  floor,
  fract,
  mrt,
  output,
  pass,
  sin,
  step,
  uniform,
  uv,
  vec3,
  vec4,
} from "three/tsl";
import * as THREE from "three/webgpu";

interface NativePostProcessingProps {
  bloomStrength?: number;
  bloomRadius?: number;
  toneMappingExposure?: number;
  /** Transition intensity 0-1, drives the glitch overlay in the post-process chain */
  transitionIntensity?: number;
}

/**
 * WebGPU post-processing: bloom + transition shader.
 * Transition is applied AFTER bloom in the pipeline,
 * so it never interferes with emissive/bloom rendering.
 */
export default function NativePostProcessing({
  bloomStrength = 2.5,
  bloomRadius = 0.5,
  toneMappingExposure = 1.2,
  transitionIntensity = 0,
}: NativePostProcessingProps) {
  const { gl, scene, camera } = useThree();
  const pipelineRef = useRef<THREE.RenderPipeline | null>(null);
  const transitionUniform = useRef(uniform(0.0));
  const timeUniform = useRef(uniform(0.0));

  useEffect(() => {
    const renderer = gl as unknown as THREE.WebGPURenderer;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = toneMappingExposure;

    const scenePass = pass(scene, camera);

    const mrtNode = mrt({
      output: output,
      emissive: vec4(emissive, output.a),
    });
    scenePass.setMRT(mrtNode);

    const emissiveTexture = scenePass.getTexture("emissive");
    emissiveTexture.type = THREE.UnsignedByteType;

    const outputPass = scenePass.getTextureNode();
    const emissivePass = scenePass.getTextureNode("emissive");

    const bloomNode = bloom(emissivePass, bloomStrength, bloomRadius);

    // === TRANSITION SHADER as post-process node ===
    const uIntensity = transitionUniform.current;
    const uTime = timeUniform.current;
    const uvCoord = uv();

    // Pixel sort / data mosh
    const blockSize = float(0.03).add(uIntensity.mul(0.05));
    const blockX = floor(uvCoord.x.div(blockSize)).mul(blockSize);
    const blockY = floor(uvCoord.y.div(blockSize)).mul(blockSize);
    const blockHash = fract(
      sin(blockX.mul(127.1).add(blockY.mul(311.7)).add(uTime)).mul(43758.5453),
    );
    const glitchTrigger = step(float(1.0).sub(uIntensity.mul(0.8)), blockHash);

    const rChannel = fract(sin(blockX.mul(43.1).add(uTime.mul(3.0))).mul(4375.5)).mul(
      glitchTrigger,
    );
    const gChannel = fract(sin(blockY.mul(78.2).add(uTime.mul(5.0))).mul(2917.1)).mul(
      glitchTrigger,
    );

    const cyanGlitch = vec3(float(0.0), float(0.94), float(1.0)).mul(rChannel).mul(0.5);
    const purpleGlitch = vec3(float(0.75), float(0.0), float(1.0)).mul(gChannel).mul(0.4);
    const transitionColor = cyanGlitch.add(purpleGlitch).mul(uIntensity);

    // Final output: scene + bloom + transition additive
    const pipeline = new THREE.RenderPipeline(renderer);
    pipeline.outputNode = outputPass.add(bloomNode).add(transitionColor);
    pipelineRef.current = pipeline;

    return () => {
      pipelineRef.current = null;
    };
  }, [gl, scene, camera, bloomStrength, bloomRadius, toneMappingExposure]);

  useFrame(({ clock }) => {
    transitionUniform.current.value = transitionIntensity;
    timeUniform.current.value = clock.getElapsedTime();

    if (pipelineRef.current) {
      pipelineRef.current.renderAsync();
    }
  }, 1);

  return null;
}
