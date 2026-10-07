import { useCallback, useEffect, useRef, useState } from "react";
import { ClientOnly } from "remix-utils/client-only";
import WebGPUCanvas from "~/components/three/canvas/WebGPUCanvas.client";
import ParticleBurst from "~/components/three/effects/ParticleBurst";
import { sceneReady } from "~/state/sceneReady";

/** All logo characters finish revealing by this point. */
const REVEAL_MS = 1600;
/** The intro always plays at least this long (reveal + a beat holding the full
 *  logo + progress to 100%) before the scene is revealed. Tune to taste. */
const INTRO_MS = 2800;
/** Hard cap: reveal even if the scene never signals ready (safety valve). */
const MAX_WAIT_MS = 12000;

interface LoadingScreenProps {
  onComplete: () => void;
  statusLabel?: string;
}

const BURST_ORIGINS: [number, number, number][] = [
  [0, 0, 0],
  [-0.5, 0.2, 0],
  [0.5, -0.2, 0],
  [0, 0.3, 0],
  [0, -0.3, 0],
];

const LOGO_TEXT = "UnchainedX";

export default function LoadingScreen({ onComplete, statusLabel = "Loading" }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [bursting, setBursting] = useState(false);
  const [revealedChars, setRevealedChars] = useState(0);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const readyRef = useRef(false);

  // Track whether the 3D scene has actually rendered real frames yet.
  useEffect(() => {
    readyRef.current = sceneReady.isReady();
    return sceneReady.subscribe((ready) => {
      readyRef.current = ready;
    });
  }, []);

  // Background grid animation
  const startBgAnim = useCallback(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Code rain columns
    const fontSize = 12;
    const columnSpacing = fontSize * 2;
    const columns = Math.floor(canvas.width / columnSpacing);
    const drops: number[] = Array.from({ length: columns }, () => Math.random() * -50);
    const chars = "0123456789abcdef";

    const animate = () => {
      const t = performance.now() * 0.001;

      // Semi-transparent black to create trail effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Code rain
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < columns; i++) {
        // Generate hex-like chunks: "0x", "a7", "f3" etc.
        const char =
          Math.random() > 0.9
            ? "0x"
            : chars[Math.floor(Math.random() * chars.length)] +
              chars[Math.floor(Math.random() * chars.length)];
        const x = i * columnSpacing;
        const y = drops[i] * fontSize;

        // Lead character — subtle
        ctx.fillStyle = `rgba(0, 240, 255, ${0.2 + Math.random() * 0.15})`;
        ctx.fillText(char, x, y);

        // Trail character — dimmer
        if (drops[i] > 1) {
          const trailChar =
            chars[Math.floor(Math.random() * chars.length)] +
            chars[Math.floor(Math.random() * chars.length)];
          ctx.fillStyle = "rgba(0, 240, 255, 0.06)";
          ctx.fillText(trailChar, x, y - fontSize);
        }

        // Reset or advance
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.5 + Math.random() * 0.5;
      }

      // Scan lines overlay
      ctx.fillStyle = "rgba(0, 240, 255, 0.01)";
      for (let y = 0; y < canvas.height; y += 3) {
        if ((y + Math.floor(t * 50)) % 6 < 3) {
          ctx.fillRect(0, y, canvas.width, 1);
        }
      }

      // Horizontal glitch line
      if (Math.random() > 0.97) {
        const glitchY = Math.random() * canvas.height;
        ctx.fillStyle = "rgba(0, 240, 255, 0.1)";
        ctx.fillRect(0, glitchY, canvas.width, 1 + Math.random() * 2);
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, []);

  useEffect(() => {
    startBgAnim();
    return () => cancelAnimationFrame(animRef.current);
  }, [startBgAnim]);

  // Progress + character reveal — completion is GATED on the 3D scene actually
  // having rendered (readyRef), not a fixed timer. This is the fix for the
  // "black scene after loading" bug: previously the loader dismissed on a timer
  // while the WebGPU scene might not have drawn its first frame yet.
  useEffect(() => {
    let done = false;
    // Count only VISIBLE time: a tab backgrounded mid-load can't render the
    // scene (rAF is throttled), so neither the progress nor the dismissal clock
    // should advance while hidden.
    let visibleElapsed = 0;
    let lastTick = performance.now();

    const complete = () => {
      if (done) return;
      done = true;
      setProgress(1);
      setRevealedChars(LOGO_TEXT.length);
      clearInterval(interval);
      setBursting(true);
    };

    const interval = setInterval(() => {
      const now = performance.now();
      if (!document.hidden) visibleElapsed += now - lastTick;
      lastTick = now;

      // Intro animation plays fully over INTRO_MS (eased), independent of the
      // scene. Once elapsed passes INTRO_MS it simply holds at 100%.
      const t = Math.min(1, visibleElapsed / INTRO_MS);
      const p = 1 - (1 - t) * (1 - t); // easeOutQuad
      setProgress(p);
      // Reveal the logo earlier than the burst, so the full name is held on
      // screen for a beat before the scene takes over.
      const revealT = Math.min(1, visibleElapsed / REVEAL_MS);
      setRevealedChars(Math.min(LOGO_TEXT.length, Math.ceil(revealT * LOGO_TEXT.length)));

      // Never dismiss while hidden — revealing now would expose a black canvas.
      if (document.hidden) return;

      const introDone = visibleElapsed >= INTRO_MS;
      if ((introDone && readyRef.current) || visibleElapsed >= MAX_WAIT_MS) {
        complete();
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleScattered = () => {
    setVisible(false);
    onComplete();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-bg flex flex-col items-center justify-center overflow-hidden">
      {/* Background animation canvas */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Particle burst — only when complete */}
      {bursting && (
        <ClientOnly fallback={null}>
          {() => (
            <WebGPUCanvas className="!absolute inset-0" dpr={[1, 1]}>
              <ambientLight intensity={0.3} />
              <ParticleBurst origins={BURST_ORIGINS} active onScattered={handleScattered} />
            </WebGPUCanvas>
          )}
        </ClientOnly>
      )}

      {/* Logo + progress — hide when bursting */}
      {!bursting && (
        <>
          {/* Character-by-character reveal with glitch */}
          <h1 className="text-3xl md:text-5xl font-bold tracking-widest mb-12 relative">
            {LOGO_TEXT.split("").map((char, i) => (
              <span
                key={`char-${char}-${i.toString()}`}
                className={`inline-block transition-all duration-300 ${
                  i < revealedChars
                    ? "text-neon-cyan neon-glow-strong opacity-100 translate-y-0"
                    : "text-transparent opacity-0 translate-y-2"
                }`}
                style={{
                  transitionDelay: `${i * 30}ms`,
                  // Glitch offset on recently revealed chars
                  transform:
                    i === revealedChars - 1 && revealedChars < LOGO_TEXT.length
                      ? `translateX(${Math.sin(Date.now() * 0.01) * 3}px)`
                      : undefined,
                }}
              >
                {char}
              </span>
            ))}
          </h1>

          {/* Progress bar with glow */}
          <div className="w-48 relative">
            <div className="h-[1px] bg-border w-full overflow-hidden">
              <div
                className="h-full bg-neon-cyan transition-all duration-200"
                style={{
                  width: `${progress * 100}%`,
                  boxShadow: `0 0 8px #00F0FF, 0 0 20px rgba(0,240,255,${progress * 0.5})`,
                }}
              />
            </div>
            {/* Percentage with pulse */}
            <p
              className="text-center text-xs text-text-muted mt-3 uppercase tracking-widest neon-glow"
              style={{ opacity: 0.5 + Math.sin(Date.now() * 0.003) * 0.3 }}
            >
              {Math.round(progress * 100)}%
            </p>
          </div>

          {/* Subtitle */}
          <p className="text-xs text-text-muted/30 mt-8 uppercase tracking-[0.3em]">
            {statusLabel}
          </p>
        </>
      )}
    </div>
  );
}
