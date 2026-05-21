import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export interface ScrollPinnedState {
  activeSection: number;
  transitionProgress: number;
  transitionActive: boolean;
  outgoingSection: number;
  incomingSection: number;
}

const DEFAULT_STATE: ScrollPinnedState = {
  activeSection: 0,
  transitionProgress: 0,
  transitionActive: false,
  outgoingSection: -1,
  incomingSection: -1,
};

/**
 * GSAP ScrollTrigger + Lenis pinned scroll system.
 *
 * DOM structure expected:
 *   .section-pin (×4) — pinned sections
 *   .transition-spacer (×3) — scrub zones between sections
 *
 * The state ref is mutated directly (no React re-renders) for R3F useFrame consumption.
 */
export function useScrollPinned(
  containerRef: React.RefObject<HTMLElement | null>,
  sectionCount: number,
) {
  const stateRef = useRef<ScrollPinnedState>({ ...DEFAULT_STATE });
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Lenis smooth scroll ---
    const lenis = new Lenis({ lerp: 0.08 });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // --- ScrollTrigger: pin each section ---
    const sectionEls = container.querySelectorAll<HTMLElement>(".section-pin");
    const spacerEls = container.querySelectorAll<HTMLElement>(".transition-spacer");

    const triggers: ScrollTrigger[] = [];

    // Pin each section in place while user scrolls through it
    sectionEls.forEach((el, i) => {
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom top",
        pin: true,
        pinSpacing: true,
        onEnter: () => {
          stateRef.current.activeSection = i;
          stateRef.current.transitionActive = false;
          stateRef.current.transitionProgress = 0;
          stateRef.current.outgoingSection = -1;
          stateRef.current.incomingSection = -1;
        },
        onEnterBack: () => {
          stateRef.current.activeSection = i;
          stateRef.current.transitionActive = false;
          stateRef.current.transitionProgress = 0;
          stateRef.current.outgoingSection = -1;
          stateRef.current.incomingSection = -1;
        },
      });
      triggers.push(st);
    });

    // Scrub transition progress for each spacer between sections
    spacerEls.forEach((el, i) => {
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          stateRef.current.transitionActive = true;
          stateRef.current.transitionProgress = self.progress;
          stateRef.current.outgoingSection = i;
          stateRef.current.incomingSection = i + 1;
        },
        onLeave: () => {
          // Transition complete — switch to incoming section
          stateRef.current.activeSection = i + 1;
          stateRef.current.transitionActive = false;
          stateRef.current.transitionProgress = 1;
          stateRef.current.outgoingSection = -1;
          stateRef.current.incomingSection = -1;
        },
        onLeaveBack: () => {
          // Scrolled back — return to outgoing section
          stateRef.current.activeSection = i;
          stateRef.current.transitionActive = false;
          stateRef.current.transitionProgress = 0;
          stateRef.current.outgoingSection = -1;
          stateRef.current.incomingSection = -1;
        },
      });
      triggers.push(st);
    });

    // --- Mobile: one swipe = one section ---
    const SWIPE_THRESHOLD_PX = 30;
    const SWIPE_MAX_DURATION_MS = 800;
    const SNAP_DURATION = 0.35;
    const SNAP_GUARD_MS = 1200; // safety unlock if onComplete misses
    let touchStartY = 0;
    let touchStartScroll = 0;
    let touchStartTime = 0;
    let snapInProgress = false;
    let snapGuardTimer: ReturnType<typeof setTimeout> | null = null;

    const sectionTriggers = triggers.slice(0, sectionEls.length);
    const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

    // Determine the section index that contains the given scroll position.
    // Uses `start - 10` tolerance so we treat positions just before a section's pin as "in" that section.
    const sectionAtScroll = (y: number): number => {
      for (let i = sectionTriggers.length - 1; i >= 0; i--) {
        if (y >= sectionTriggers[i].start - 10) return i;
      }
      return 0;
    };

    const releaseLock = () => {
      snapInProgress = false;
      if (snapGuardTimer) {
        clearTimeout(snapGuardTimer);
        snapGuardTimer = null;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!isMobile()) return;
      touchStartY = e.touches[0].clientY;
      touchStartScroll = lenis.scroll;
      touchStartTime = performance.now();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isMobile() || snapInProgress) return;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const dt = performance.now() - touchStartTime;
      if (Math.abs(dy) < SWIPE_THRESHOLD_PX || dt > SWIPE_MAX_DURATION_MS) return;

      const direction = dy < 0 ? 1 : -1; // swipe up = forward
      const baseIdx = sectionAtScroll(touchStartScroll);
      const target = baseIdx + direction;
      // Out of bounds: let native scroll handle (e.g. reach Footer past last section)
      if (target < 0 || target >= sectionTriggers.length) return;

      snapInProgress = true;
      snapGuardTimer = setTimeout(releaseLock, SNAP_GUARD_MS);
      lenis.scrollTo(sectionTriggers[target].start, {
        duration: SNAP_DURATION,
        easing: (x: number) => 1 - (1 - x) ** 3,
        onComplete: releaseLock,
      });
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      for (const st of triggers) st.kill();
      lenis.destroy();
      lenisRef.current = null;
      if (snapGuardTimer) clearTimeout(snapGuardTimer);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [containerRef, sectionCount]);

  return stateRef;
}
