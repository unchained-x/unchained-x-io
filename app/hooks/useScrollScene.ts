import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

export interface SectionProgress {
  /** Which section index is currently active (0-based) */
  activeSection: number;
  /** Overall scroll progress 0-1 across entire page */
  totalProgress: number;
  /** Progress within the current section 0-1 */
  sectionProgress: number;
}

interface UseScrollSceneOptions {
  /** Number of sections */
  sectionCount: number;
  /** CSS selector for the scroll container */
  containerSelector?: string;
}

export function useScrollScene({
  sectionCount,
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
      lerp: 0.08,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Create ScrollTrigger for each section with snap
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // Overall page progress
    ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const total = self.progress;
        const sectionSize = 1 / sectionCount;
        const active = Math.min(sectionCount - 1, Math.floor(total / sectionSize));
        const sectionStart = active * sectionSize;
        const sectionProg = Math.min(1, (total - sectionStart) / sectionSize);

        setProgress({
          activeSection: active,
          totalProgress: total,
          sectionProgress: sectionProg,
        });
      },
    });

    // Snap behavior — smooth snap to section boundaries
    ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: "bottom bottom",
      snap: {
        snapTo: 1 / (sectionCount - 1),
        duration: { min: 0.3, max: 0.6 },
        ease: "power2.inOut",
      },
    });

    return () => {
      for (const st of ScrollTrigger.getAll()) st.kill();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [sectionCount, containerSelector]);

  return progress;
}
