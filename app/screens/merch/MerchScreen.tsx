import { useEffect } from "react";
import { ClientOnly } from "remix-utils/client-only";
import Footer from "~/components/dom/layout/Footer";
import { setAmbientProfile } from "~/core/adapters/audio";
import { useFooterAnimation } from "~/hooks/useFooterAnimation";
import MerchScene from "./scene/MerchScene.client";

export default function MerchScreen() {
  const footerRef = useFooterAnimation();

  useEffect(() => {
    setAmbientProfile("merch");
  }, []);

  return (
    <>
      <ClientOnly fallback={null}>{() => <MerchScene />}</ClientOnly>

      <div className="fixed md:relative z-30 top-0 left-0 right-0 pt-28 pb-4 px-8 md:px-16">
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

      <div ref={footerRef} className="relative z-35 mt-[100vh] pointer-events-auto">
        <Footer />
      </div>
    </>
  );
}
