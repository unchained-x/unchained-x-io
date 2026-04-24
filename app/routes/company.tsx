import { useEffect, useRef } from "react";
import { ClientOnly } from "remix-utils/client-only";
import Footer from "~/components/layout/Footer";
import CompanyScene from "~/components/company/CompanyScene.client";

export function meta() {
  return [
    { title: "Company — UnchainedX" },
    { name: "description", content: "Company information — UnchainedX, a creative venture studio." },
  ];
}

const COMPANY_INFO = [
  { label: "Company", value: "UnchainedX" },
  { label: "Founded", value: "2026" },
  { label: "Location", value: "Saitama, Japan" },
  { label: "Representative", value: "Keishi Shimmachi" },
  { label: "Contact", value: "hello@unchainedx.io", href: "mailto:hello@unchainedx.io" },
];

export default function Company() {
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
        {() => <CompanyScene />}
      </ClientOnly>

      {/* Header */}
      <div className="relative z-10 pt-28 pb-4 px-8 md:px-16">
        <h1
          className="text-4xl md:text-5xl font-bold tracking-wider mb-3 neon-glow-strong"
          style={{ fontFamily: "Rubik, sans-serif", color: "#00F0FF" }}
        >
          Company
        </h1>
      </div>

      {/* Company info — center */}
      <div className="fixed z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col gap-6">
          {COMPANY_INFO.map((item) => (
            <div key={item.label} className="flex items-baseline gap-6">
              <span
                className="text-[10px] font-mono uppercase tracking-[0.25em] w-32 text-right flex-shrink-0"
                style={{
                  color: "rgba(0,240,255,0.4)",
                  textShadow: "0 0 4px rgba(0,240,255,0.15)",
                }}
              >
                {item.label}
              </span>
              {item.href ? (
                <a
                  href={item.href}
                  className="text-sm font-mono tracking-wide transition-all duration-300"
                  style={{
                    color: "#E619A0",
                    textShadow: "0 0 8px rgba(230,25,150,0.4)",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.textShadow = "0 0 12px rgba(230,25,150,0.7), 0 0 24px rgba(230,25,150,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.textShadow = "0 0 8px rgba(230,25,150,0.4)";
                  }}
                >
                  {item.value}
                </a>
              ) : (
                <span
                  className="text-sm font-mono tracking-wide"
                  style={{
                    color: "#E0E0FF",
                    textShadow: "0 0 6px rgba(224,224,255,0.15)",
                  }}
                >
                  {item.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div ref={footerRef} className="relative z-20 mt-[100vh] pointer-events-auto">
        <Footer />
      </div>
    </>
  );
}
