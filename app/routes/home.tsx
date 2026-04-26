import { useEffect, useRef } from "react";
import { ClientOnly } from "remix-utils/client-only";
import Footer from "~/components/layout/Footer";
import HomeScene from "~/components/canvas/HomeScene.client";
import { setAmbientProfile } from "~/lib/audio";
import { useScrollPinned } from "~/hooks/useScrollPinned";
import type { Route } from "./+types/home";

import { seoMeta } from "~/lib/seo";

export function meta(_args: Route.MetaArgs) {
  return seoMeta({
    title: "UnchainedX — Creative Venture Studio",
    description: "UnchainedX is a creative venture studio designing and expanding value, networks, and human potential.",
    path: "/",
  });
}

const SECTION_COUNT = 4;

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollState = useScrollPinned(containerRef, SECTION_COUNT);
  const footerRef = useRef<HTMLDivElement>(null);
  const prevSectionRef = useRef(-1);

  // Switch ambient profile per section
  const SECTION_PROFILES = ["hero", "teaser", "identity", "values"];
  useEffect(() => {
    const interval = setInterval(() => {
      const section = scrollState.current.activeSection;
      if (section !== prevSectionRef.current) {
        prevSectionRef.current = section;
        setAmbientProfile(SECTION_PROFILES[section] || "hero");
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const ratio = entry.intersectionRatio;
          const el = entry.target as HTMLElement;
          el.style.transform = `translateY(${(1 - ratio) * 30}px)`;
          el.style.opacity = String(Math.min(1, ratio * 2));

          const children = el.querySelectorAll("[data-footer-item]");
          children.forEach((child, i) => {
            const c = child as HTMLElement;
            const delay = i * 0.08;
            const childProgress = Math.max(0, Math.min(1, (ratio - delay) * 2.5));
            c.style.transform = `translateY(${(1 - childProgress) * 40}px)`;
            c.style.opacity = String(childProgress);
          });
        }
      },
      { threshold: Array.from({ length: 20 }, (_, i) => i / 19) },
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <ClientOnly fallback={null}>
        {() => <HomeScene scrollState={scrollState} />}
      </ClientOnly>

      <div ref={containerRef} className="scroll-container relative z-10 pointer-events-none">
        {Array.from({ length: SECTION_COUNT }, (_, idx) => (
          <div key={`section-group-${idx.toString()}`}>
            <section className="section-pin h-screen" />
            {idx < SECTION_COUNT - 1 && (
              <div className="transition-spacer h-screen" />
            )}
          </div>
        ))}
      </div>

      <div ref={footerRef} className="relative z-20 pointer-events-auto">
        <Footer />
      </div>
    </>
  );
}
