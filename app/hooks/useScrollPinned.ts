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
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

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

    // --- Mobile: drag follows finger natively; on release snap to nearest section ---
    const SNAP_DURATION = 0.5;
    const sectionTriggers = triggers.slice(0, sectionEls.length);

    const snapToNearestSection = () => {
      const currentScroll = lenis.scroll;
      const lastSection = sectionTriggers[sectionTriggers.length - 1];
      // Past the last section's pin range → let user reach Footer freely
      if (currentScroll > lastSection.end) return;

      let nearestIdx = 0;
      let minDist = Number.POSITIVE_INFINITY;
      sectionTriggers.forEach((trigger, i) => {
        const dist = Math.abs(currentScroll - trigger.start);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = i;
        }
      });

      lenis.scrollTo(sectionTriggers[nearestIdx].start, {
        duration: SNAP_DURATION,
        easing: (x: number) => 1 - (1 - x) ** 3,
      });
    };

    const onTouchEnd = () => {
      if (!isMobile) return;
      // Defer so iOS momentum kicks in first; snap overrides it after a moment
      setTimeout(snapToNearestSection, 80);
    };

    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      for (const st of triggers) st.kill();
      lenis.destroy();
      lenisRef.current = null;
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [containerRef, sectionCount]);

  return stateRef;
}
