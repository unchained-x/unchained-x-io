/**
 * Cross-tree signal: has the active 3D scene actually rendered a real frame yet?
 *
 * The loading overlay (LoadingScreen) used to dismiss on a pure timer, decoupled
 * from whether the WebGPU scene had compiled its shaders and produced a frame.
 * Because every scene renders ONLY through a manual `pipeline.render()` inside a
 * prioritised `useFrame` (which disables R3F's automatic render), the canvas is
 * black until that first real frame lands. If the loader was already gone, the
 * user saw a black screen.
 *
 * The render components (NativePostProcessing / ScenePostProcessing / the 404
 * Post) call `markReady()` after a few rendered frames; the loader waits for it.
 */

type Listener = (ready: boolean) => void;

let ready = false;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(ready);
}

export const sceneReady = {
  /** Called by root on (re)navigation, before a new scene mounts. */
  reset() {
    ready = false;
    emit();
  },
  /** Called by the active scene's render loop once it has drawn real frames. */
  markReady() {
    if (ready) return;
    ready = true;
    emit();
  },
  isReady() {
    return ready;
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
