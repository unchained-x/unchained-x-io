import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

export interface SectionProgress {
  activeSection: number;
  totalProgress: number;
  sectionProgress: number;
}

interface UseScrollSceneOptions {
  sectionCount: number;
  /** Number of distinct "worlds" to snap to */
  worldCount?: number;
  containerSelector?: string;
}

export function useScrollScene({
  sectionCount,
  worldCount = 4,
  containerSelector = ".scroll-container",
}: UseScrollSceneOptions) {
  const lenisRef = useRef<Lenis | null>(null);
  const [progress, setProgress] = useState<SectionProgress>({
    activeSection: 0,
    totalProgress: 0,
    sectionProgress: 0,
  });

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.06,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    const container = document.querySelector(containerSelector);
    if (!container) return;

    // Overall progress tracker
    ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const total = self.progress;
        const worldSize = 1 / worldCount;
        const active = Math.min(worldCount - 1, Math.floor(total / worldSize));
        const worldStart = active * worldSize;
        const worldProg = Math.min(1, (total - worldStart) / worldSize);

        setProgress({
          activeSection: active,
          totalProgress: total,
          sectionProgress: worldProg,
        });
      },
    });

    // Snap to world boundaries
    const snapPoints = Array.from({ length: worldCount }, (_, i) => i / (worldCount - 1));

    ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: "bottom bottom",
      snap: {
        snapTo: snapPoints,
        duration: { min: 0.5, max: 1.0 },
        delay: 0.1,
        ease: "power2.inOut",
      },
    });

    return () => {
      for (const st of ScrollTrigger.getAll()) st.kill();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [worldCount, containerSelector]);

  return progress;
}
