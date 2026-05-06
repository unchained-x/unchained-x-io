import { useEffect, useRef } from "react";
import { ClientOnly } from "remix-utils/client-only";
import Footer from "~/components/dom/layout/Footer";
import { setAmbientProfile } from "~/core/adapters/audio";
import { useFooterAnimation } from "~/hooks/useFooterAnimation";
import { useScrollPinned } from "~/hooks/useScrollPinned";
import HomeScene from "./scene/HomeScene.client";

const SECTION_COUNT = 4;
const SECTION_PROFILES = ["hero", "teaser", "identity", "values"];

export default function HomeScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollState = useScrollPinned(containerRef, SECTION_COUNT);
  const footerRef = useFooterAnimation();
  const prevSectionRef = useRef(-1);

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
