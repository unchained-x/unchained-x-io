import { useEffect } from "react";
import { setAmbientProfile } from "~/lib/audio";
import { useFooterAnimation } from "~/hooks/useFooterAnimation";
import { ClientOnly } from "remix-utils/client-only";
import Footer from "~/components/layout/Footer";
import { useI18n } from "~/lib/i18n";
import CompanyScene from "~/components/company/CompanyScene.client";

import { seoMeta } from "~/lib/seo";

export function meta() {
  return seoMeta({
    title: "Company — UnchainedX",
    description: "Company information — UnchainedX, a creative venture studio.",
    path: "/company",
  });
}

const COMPANY_INFO_KEYS = [
  { labelKey: "company.label.company", value: "UnchainedX" },
  { labelKey: "company.label.founded", value: "2026" },
  { labelKey: "company.label.location", value: "Saitama, Japan" },
  { labelKey: "company.label.representative", value: "Keishi Shimmachi" },
  { labelKey: "company.label.contact", value: "hello@unchainedx.io", href: "mailto:hello@unchainedx.io" },
];

export default function Company() {
  const { t } = useI18n();
  const footerRef = useFooterAnimation();

  useEffect(() => { setAmbientProfile("company"); }, []);

  return (
    <>
      {/* 3D Scene */}
      <ClientOnly fallback={null}>
        {() => <CompanyScene />}
      </ClientOnly>

      {/* Header */}
      <div className="fixed md:relative z-30 top-0 left-0 right-0 pt-28 pb-4 px-8 md:px-16">
        <h1
          className="text-4xl md:text-5xl font-bold tracking-wider mb-3 neon-glow-strong"
          style={{ fontFamily: "Rubik, sans-serif", color: "#00F0FF" }}
        >
          Company
        </h1>
      </div>

      {/* Company info — center */}
      <div className="fixed z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 w-full max-w-lg">
        <div className="flex flex-col gap-4 md:gap-6">
          {COMPANY_INFO_KEYS.map((item) => (
            <div key={item.labelKey} className="flex flex-col items-center md:items-stretch md:flex-row md:items-baseline gap-1 md:gap-6">
              <span
                className="text-[10px] font-mono uppercase tracking-[0.25em] text-center md:text-right md:w-32 flex-shrink-0"
                style={{
                  color: "rgba(0,240,255,0.4)",
                  textShadow: "0 0 4px rgba(0,240,255,0.15)",
                }}
              >
                {t(item.labelKey)}
              </span>
              {item.href ? (
                <a
                  href={item.href}
                  className="text-sm font-mono tracking-wide transition-all duration-300 text-center md:text-left"
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
                  className="text-sm font-mono tracking-wide text-center md:text-left"
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
      <div ref={footerRef} className="relative z-35 mt-[100vh] pointer-events-auto">
        <Footer />
      </div>
    </>
  );
}
