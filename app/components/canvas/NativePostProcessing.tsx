import { useFrame, useThree } from "@react-three/fiber";
import { type MutableRefObject, useEffect, useRef } from "react";
import { bloom } from "~/lib/tsl/BloomNode.js";
import {
  abs,
  emissive,
  float,
  floor,
  fract,
  min,
  mix,
  mrt,
  output,
  pass,
  sin,
  smoothstep,
  step,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import type { Group } from "three";
import * as THREE from "three/webgpu";
import type { ScrollPinnedState } from "~/hooks/useScrollPinned";
import { fbmLight } from "~/lib/tsl/noise";

interface NativePostProcessingProps {
  bloomStrength?: number;
  bloomRadius?: number;
  toneMappingExposure?: number;
  sectionGroups?: MutableRefObject<(Group | null)[]>;
  scrollState: React.RefObject<ScrollPinnedState>;
}

export default function NativePostProcessing({
  bloomStrength = 2.5,
  bloomRadius = 0.5,
  toneMappingExposure = 1.2,
  sectionGroups,
  scrollState,
}: NativePostProcessingProps) {
  const { gl, scene, camera, size } = useThree();
  const normalPipelineRef = useRef<THREE.RenderPipeline | null>(null);
  const transitionPipelineRef = useRef<THREE.RenderPipeline | null>(null);
  const progressUniform = useRef(uniform(0.0));
  const timeUniform = useRef(uniform(0.0));
  const snapshotRTRef = useRef<THREE.RenderTarget | null>(null);
  const wasTransitioningRef = useRef(false);

  useEffect(() => {
    const renderer = gl as unknown as THREE.WebGPURenderer;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = toneMappingExposure;

    const dpr = renderer.getPixelRatio();
    const rtWidth = Math.floor(size.width * dpr);
    const rtHeight = Math.floor(size.height * dpr);
    const snapshotRT = new THREE.RenderTarget(rtWidth, rtHeight, {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    snapshotRTRef.current = snapshotRT;
    renderer.setRenderTarget(snapshotRT);
    renderer.clear();
    renderer.setRenderTarget(null);

    // =========================================================
    // Normal pipeline: scene + bloom. NO snapshotRT reference.
    // Used for: normal rendering + snapshot capture
    // =========================================================
    const normalPass = pass(scene, camera);
    normalPass.setMRT(mrt({ output, emissive: vec4(emissive, output.a) }));
    const normalEmissiveTex = normalPass.getTexture("emissive");
    normalEmissiveTex.type = THREE.UnsignedByteType;
    const normalOutput = normalPass.getTextureNode();
    const normalEmissive = normalPass.getTextureNode("emissive");
    const normalBloom = bloom(normalEmissive, bloomStrength, bloomRadius);
    const normalWithBloom = normalOutput.add(normalBloom);

    const normalPipeline = new THREE.RenderPipeline(renderer);
    normalPipeline.outputNode = normalWithBloom;
    normalPipelineRef.current = normalPipeline;

    // =========================================================
    // Transition pipeline: scene + bloom + composite with snapshot
    // Used for: transition rendering (reads from snapshotRT)
    // =========================================================
    const transPass = pass(scene, camera);
    transPass.setMRT(mrt({ output, emissive: vec4(emissive, output.a) }));
    const transEmissiveTex = transPass.getTexture("emissive");
    transEmissiveTex.type = THREE.UnsignedByteType;
    const transOutput = transPass.getTextureNode();
    const transEmissive = transPass.getTextureNode("emissive");
    const transBloom = bloom(transEmissive, bloomStrength, bloomRadius);
    const liveWithBloom = transOutput.add(transBloom);

    const uProgress = progressUniform.current;
    const uTime = timeUniform.current;
    const uvCoord = uv();

    /*
    // =============================================
    // Transition B: Noise dissolve boundary
    // =============================================
    const baseWipeB = float(1.0).sub(uProgress);
    const noiseScaleB = float(3.0);
    const noiseInputB = uvCoord.mul(noiseScaleB).add(vec2(uTime.mul(0.15), uTime.mul(0.1)));
    const noiseValB = fbmLight(noiseInputB);
    const warpAmountB = float(0.25);
    const warpedWipeB = baseWipeB.add(noiseValB.sub(0.5).mul(warpAmountB));
    const edgeSoftnessB = float(0.04);
    const dissolveMaskB = smoothstep(warpedWipeB.add(edgeSoftnessB), warpedWipeB.sub(edgeSoftnessB), uvCoord.y);
    const edgeDistB = abs(uvCoord.y.sub(warpedWipeB));
    const edgeMaskB = smoothstep(float(0.08), float(0.0), edgeDistB);
    const parallaxB = uProgress.mul(0.025);
    const outgoingUVB = uvCoord.add(vec2(float(0.0), parallaxB));
    const displacementB = edgeMaskB.mul(noiseValB.sub(0.5)).mul(0.008);
    const outgoingUVFinalB = outgoingUVB.add(vec2(displacementB.mul(0.3), displacementB));
    const caAmountB = edgeMaskB.mul(0.004);
    const caDirB = vec2(float(0.0), float(1.0));
    const outRB = texture(snapshotRT.texture, outgoingUVFinalB.add(caDirB.mul(caAmountB))).x;
    const outGB = texture(snapshotRT.texture, outgoingUVFinalB).y;
    const outBB = texture(snapshotRT.texture, outgoingUVFinalB.sub(caDirB.mul(caAmountB))).z;
    const outSceneB = vec3(outRB, outGB, outBB);
    const inSceneB = liveWithBloom.rgb;
    const compositedB = mix(inSceneB, outSceneB, dissolveMaskB);
    transitionPipeline.outputNode = vec4(compositedB, float(1.0));
    */

    /*
    // =============================================
    // Transition C: Blur → Focus (rack focus)
    // =============================================
    const blurStrength = uProgress.mul(0.012);
    const blurDir1 = vec2(float(1.0), float(0.0)).mul(blurStrength);
    const blurDir2 = vec2(float(0.0), float(1.0)).mul(blurStrength);
    const blurDir3 = vec2(float(0.707), float(0.707)).mul(blurStrength);
    const blurDir4 = vec2(float(-0.707), float(0.707)).mul(blurStrength);
    const sample0 = texture(snapshotRT.texture, uvCoord).rgb;
    const sample1 = texture(snapshotRT.texture, uvCoord.add(blurDir1)).rgb;
    const sample2 = texture(snapshotRT.texture, uvCoord.sub(blurDir1)).rgb;
    const sample3 = texture(snapshotRT.texture, uvCoord.add(blurDir2)).rgb;
    const sample4 = texture(snapshotRT.texture, uvCoord.sub(blurDir2)).rgb;
    const sample5 = texture(snapshotRT.texture, uvCoord.add(blurDir3)).rgb;
    const sample6 = texture(snapshotRT.texture, uvCoord.sub(blurDir3)).rgb;
    const sample7 = texture(snapshotRT.texture, uvCoord.add(blurDir4)).rgb;
    const sample8 = texture(snapshotRT.texture, uvCoord.sub(blurDir4)).rgb;
    const outSceneC = sample0.add(sample1).add(sample2).add(sample3).add(sample4)
      .add(sample5).add(sample6).add(sample7).add(sample8).div(9.0);
    const inSceneC = liveWithBloom.rgb;
    const fadeMaskC = smoothstep(float(0.0), float(1.0), uProgress);
    const compositedC = mix(outSceneC, inSceneC, fadeMaskC);
    transitionPipeline.outputNode = vec4(compositedC, float(1.0));
    */

    /*
    // =============================================
    // Transition E: Ripple (wave boundary)
    // =============================================
    const baseWipeE = float(1.0).sub(uProgress);
    const rippleFreq = float(12.0);
    const rippleAmp = float(0.06);
    const ampDecay = uProgress.mul(float(1.0).sub(uProgress)).mul(4.0);
    const ripple = sin(uvCoord.x.mul(rippleFreq).add(uTime.mul(2.0))).mul(rippleAmp).mul(ampDecay);
    const ripple2 = sin(uvCoord.x.mul(rippleFreq.mul(2.3)).sub(uTime.mul(3.0))).mul(rippleAmp.mul(0.4)).mul(ampDecay);
    const warpedWipeE = baseWipeE.add(ripple).add(ripple2);
    const edgeSoftnessE = float(0.03);
    const dissolveMaskE = smoothstep(warpedWipeE.add(edgeSoftnessE), warpedWipeE.sub(edgeSoftnessE), uvCoord.y);
    const edgeDistE = abs(uvCoord.y.sub(warpedWipeE));
    const edgeMaskE = smoothstep(float(0.06), float(0.0), edgeDistE);
    const parallaxE = uProgress.mul(0.02);
    const outgoingUVE = uvCoord.add(vec2(float(0.0), parallaxE));
    const refractionE = edgeMaskE.mul(ripple).mul(0.3);
    const outgoingUVFinalE = outgoingUVE.add(vec2(refractionE, refractionE.mul(0.5)));
    const outSceneE = texture(snapshotRT.texture, outgoingUVFinalE).rgb;
    const inSceneE = liveWithBloom.rgb;
    const compositedE = mix(inSceneE, outSceneE, dissolveMaskE);
    const causticE = edgeMaskE.mul(edgeMaskE).mul(sin(uvCoord.x.mul(20.0).add(uTime.mul(4.0))).mul(0.5).add(0.5)).mul(0.08);
    const highlightE = vec3(float(0.8), float(0.9), float(1.0)).mul(causticE);
    transitionPipeline.outputNode = vec4(compositedE.add(highlightE), float(1.0));
    */

    /*
    // =============================================
    // Transition D: Pixelation → Reconstruction
    // =============================================
    const outBlockSize = mix(float(1.0), float(80.0), uProgress.mul(uProgress));
    const outPixelUV = floor(uvCoord.mul(outBlockSize)).div(outBlockSize);
    const outSceneD = texture(snapshotRT.texture, outPixelUV).rgb;
    const inSceneD = liveWithBloom.rgb;
    const fadeMaskD = smoothstep(float(0.3), float(0.7), uProgress);
    const compositedD = mix(outSceneD, inSceneD, fadeMaskD);
    transitionPipeline.outputNode = vec4(compositedD, float(1.0));
    */

    // =============================================
    // Transition F: Fragment split
    // Screen splits into grid cells, each flips to incoming at random timing
    // =============================================

    // Grid
    const gridSize = vec2(float(8.0), float(6.0));
    const cellUV = uvCoord.mul(gridSize);
    const cellID = floor(cellUV);

    // Random threshold per cell (determines when this cell flips)
    const cellHash = fract(sin(cellID.x.mul(127.1).add(cellID.y.mul(311.7))).mul(43758.5453));
    // Add slight time variation for shimmer
    const cellHash2 = fract(sin(cellID.x.mul(43.7).add(cellID.y.mul(78.3)).add(uTime.mul(0.5))).mul(2917.1));
    // Combine: base random + slight temporal variation
    const flipThreshold = cellHash.mul(0.85).add(cellHash2.mul(0.15));

    // Cell flips when progress exceeds its threshold
    // Use smoothstep for soft transition within each cell
    const cellProgress = smoothstep(
      flipThreshold.sub(0.05),
      flipThreshold.add(0.05),
      uProgress,
    );

    // Sample outgoing
    const outScene = texture(snapshotRT.texture, uvCoord).rgb;

    // Incoming (live + bloom)
    const inScene = liveWithBloom.rgb;

    // Per-cell composite
    const composited = mix(outScene, inScene, cellProgress);

    // Subtle cell border highlight during transition
    const cellLocal = fract(cellUV);
    const borderDist = min(min(cellLocal.x, float(1.0).sub(cellLocal.x)), min(cellLocal.y, float(1.0).sub(cellLocal.y)));
    const borderMask = smoothstep(float(0.02), float(0.0), borderDist);
    // Only show borders on cells that are mid-transition
    const borderActive = cellProgress.mul(float(1.0).sub(cellProgress)).mul(4.0);
    const borderGlow = borderMask.mul(borderActive).mul(0.15);
    const borderColor = vec3(float(0.0), float(0.94), float(1.0)).mul(borderGlow);

    const transitionPipeline = new THREE.RenderPipeline(renderer);
    transitionPipeline.outputNode = vec4(composited.add(borderColor), float(1.0));
    transitionPipelineRef.current = transitionPipeline;

    return () => {
      normalPipelineRef.current = null;
      transitionPipelineRef.current = null;
      snapshotRT.dispose();
      snapshotRTRef.current = null;
    };
  }, [gl, scene, camera, size, bloomStrength, bloomRadius, toneMappingExposure]);

  useFrame(({ clock }) => {
    const state = scrollState.current;
    if (!state) return;

    progressUniform.current.value = state.transitionProgress;
    timeUniform.current.value = clock.getElapsedTime();

    const groups = sectionGroups?.current;
    const snapshotRT = snapshotRTRef.current;
    const renderer = gl as unknown as THREE.WebGPURenderer;

    if (state.transitionActive && groups && snapshotRT) {
      const sectionCount = groups.length;

      // CAPTURE FRAME: use normalPipeline (no snapshotRT reference = no feedback loop)
      if (!wasTransitioningRef.current
        && state.outgoingSection >= 0
        && state.outgoingSection < sectionCount
      ) {
        // Show outgoing only
        for (let i = 0; i < sectionCount; i++) {
          if (groups[i]) groups[i]!.visible = i === state.outgoingSection;
        }

        // Capture outgoing + bloom to snapshotRT (disable color transform to get LINEAR values)
        const normalPipeline = normalPipelineRef.current;
        if (normalPipeline) {
          normalPipeline.outputColorTransform = false;
          normalPipeline.needsUpdate = true;
          renderer.setRenderTarget(snapshotRT);
          normalPipeline.render();
          renderer.setRenderTarget(null);
          normalPipeline.outputColorTransform = true;
          normalPipeline.needsUpdate = true;
        }

        // Also render to screen (same cached pass = outgoing + bloom)
        normalPipelineRef.current?.render();

        // Switch to incoming for next frame
        for (let i = 0; i < sectionCount; i++) {
          if (groups[i]) groups[i]!.visible = i === state.incomingSection;
        }
      } else {
        // SUBSEQUENT FRAMES: transitionPipeline composites snapshot + live incoming
        if (state.incomingSection >= 0 && state.incomingSection < sectionCount) {
          for (let i = 0; i < sectionCount; i++) {
            if (groups[i]) groups[i]!.visible = i === state.incomingSection;
          }
        }

        transitionPipelineRef.current?.renderAsync();
      }
    } else {
      // Normal: normalPipeline (scene + bloom)
      if (groups) {
        for (let i = 0; i < groups.length; i++) {
          if (groups[i]) groups[i]!.visible = i === state.activeSection;
        }
      }

      normalPipelineRef.current?.renderAsync();
    }

    wasTransitioningRef.current = state.transitionActive;
  }, 1);

  return null;
}
