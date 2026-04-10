import { useEffect, useRef, useState } from "react";

export interface SectionProgress {
  activeSection: number;
  totalProgress: number;
  sectionProgress: number;
}

interface UseScrollSceneOptions {
  sectionCount: number;
  containerSelector?: string;
}

/**
 * Pure browser-native scroll tracking.
 * No Lenis, no GSAP snap — just CSS scroll-snap + scroll event listener.
 * CSS handles the snapping, JS just reads the position.
 */
export function useScrollScene({
  sectionCount,
  containerSelector = ".scroll-container",
}: UseScrollSceneOptions) {
  const [progress, setProgress] = useState<SectionProgress>({
    activeSection: 0,
    totalProgress: 0,
    sectionProgress: 0,
  });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      const container = document.querySelector(containerSelector);
      if (!container) return;

      const scrollTop = window.scrollY;
      const maxScroll = container.scrollHeight - window.innerHeight;
      const total = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;

      const sectionSize = 1 / sectionCount;
      const active = Math.min(sectionCount - 1, Math.floor(total / sectionSize));
      const sectionStart = active * sectionSize;
      const sectionProg = Math.min(1, (total - sectionStart) / sectionSize);

      setProgress({
        activeSection: active,
        totalProgress: total,
        sectionProgress: sectionProg,
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [sectionCount, containerSelector]);

  return progress;
}
