import { useEffect, useRef, useState } from "react";
import { ClientOnly } from "remix-utils/client-only";
import LoadingScene from "~/components/canvas/LoadingScene";
import WebGPUCanvas from "~/components/canvas/WebGPUCanvas.client";

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Simulate loading progress (will be replaced with real asset loading)
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      // Ease in: fast at start, slow near end
      const p = Math.min(1, 1 - Math.exp(-elapsed / 2));
      setProgress(p);

      if (p >= 0.99) {
        setProgress(1);
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleComplete = () => {
    setVisible(false);
    onComplete();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-bg flex items-center justify-center">
      <ClientOnly
        fallback={
          <div className="text-neon-cyan text-sm uppercase tracking-widest animate-pulse">
            Loading...
          </div>
        }
      >
        {() => (
          <WebGPUCanvas className="!absolute inset-0" dpr={[1, 1.5]}>
            <LoadingScene progress={progress} onComplete={handleComplete} />
          </WebGPUCanvas>
        )}
      </ClientOnly>

      {/* Progress bar */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48">
        <div className="h-[1px] bg-border w-full">
          <div
            className="h-full bg-neon-cyan transition-all duration-200"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="text-center text-xs text-text-muted mt-2 uppercase tracking-widest">
          {Math.round(progress * 100)}%
        </p>
      </div>
    </div>
  );
}
