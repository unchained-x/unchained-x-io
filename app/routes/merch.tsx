import { useEffect, useRef } from "react";
import { ClientOnly } from "remix-utils/client-only";
import Footer from "~/components/layout/Footer";
import MerchScene from "~/components/merch/MerchScene.client";

export function meta() {
  return [
    { title: "Merch — UnchainedX" },
    { name: "description", content: "UnchainedX merchandise — coming soon." },
  ];
}

export default function Merch() {
  const footerRef = useRef<HTMLDivElement>(null);

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
      {/* 3D Scene */}
      <ClientOnly fallback={null}>
        {() => <MerchScene />}
      </ClientOnly>

      {/* Header */}
      <div className="relative z-10 pt-28 pb-4 px-8 md:px-16">
        <h1
          className="text-4xl md:text-5xl font-bold tracking-wider mb-3 neon-glow-strong"
          style={{ fontFamily: "Rubik, sans-serif", color: "#00F0FF" }}
        >
          Merch
        </h1>
        <p className="text-sm max-w-xl leading-relaxed neon-glow" style={{ color: "rgba(0,240,255,0.6)" }}>
          Something is being forged.
        </p>
      </div>

      {/* Coming Soon — center */}
      <div className="fixed z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <p
          className="text-2xl md:text-3xl font-bold tracking-[0.3em] uppercase mb-3"
          style={{
            fontFamily: "Rubik, sans-serif",
            color: "#00F0FF",
            textShadow: "0 0 12px rgba(0,240,255,0.5), 0 0 24px rgba(0,240,255,0.2)",
          }}
        >
          Coming Soon
        </p>
        <p
          className="text-xs font-mono tracking-[0.2em] uppercase"
          style={{
            color: "rgba(224,224,255,0.4)",
            textShadow: "0 0 6px rgba(224,224,255,0.1)",
          }}
        >
          Stay tuned
        </p>
      </div>

      {/* Footer */}
      <div ref={footerRef} className="relative z-20 mt-[100vh] pointer-events-auto">
        <Footer />
      </div>
    </>
  );
}
