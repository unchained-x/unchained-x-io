import { useEffect, useRef } from "react";
import { ClientOnly } from "remix-utils/client-only";
import Footer from "~/components/layout/Footer";
import HomeScene from "~/components/canvas/HomeScene.client";
import { useScrollScene } from "~/hooks/useScrollScene";
import type { Route } from "./+types/home";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "UnchainedX" },
    {
      name: "description",
      content:
        "UnchainedX is a creative venture studio designing and expanding value, networks, and human potential.",
    },
  ];
}

const SECTION_COUNT = 4;

export default function Home() {
  const scrollProgress = useScrollScene({
    sectionCount: SECTION_COUNT,
  });
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const ratio = entry.intersectionRatio;
          const el = entry.target as HTMLElement;
          // Parallax: footer slides up faster than scroll
          el.style.transform = `translateY(${(1 - ratio) * 30}px)`;
          el.style.opacity = String(Math.min(1, ratio * 2));

          // Stagger children
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
      <ClientOnly fallback={null}>{() => <HomeScene scrollProgress={scrollProgress} />}</ClientOnly>

      <div className="scroll-container relative z-10 pointer-events-none">
        {Array.from({ length: SECTION_COUNT }, (_, idx) => (
          <section key={`scroll-spacer-${idx.toString()}`} className="scroll-section h-screen" />
        ))}
      </div>

      {/* Footer — parallax reveal over 3D scene */}
      <div ref={footerRef} className="relative z-20 pointer-events-auto">
        <Footer />
      </div>
    </>
  );
}
