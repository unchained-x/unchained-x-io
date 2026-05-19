import { useEffect } from "react";
import { ClientOnly } from "remix-utils/client-only";
import Footer from "~/components/dom/layout/Footer";
import { setAmbientProfile } from "~/core/adapters/audio";
import { useI18n } from "~/core/services/i18n";
import { useFooterAnimation } from "~/hooks/useFooterAnimation";
import CompanyScene from "./scene/CompanyScene.client";

interface CompanyInfoItem {
  labelKey: string;
  valueKey?: string;
  value?: string;
  href?: string;
}

const COMPANY_INFO_KEYS: CompanyInfoItem[] = [
  { labelKey: "company.label.company", valueKey: "company.value.company" },
  { labelKey: "company.label.founded", value: "2026" },
  { labelKey: "company.label.location", valueKey: "company.value.location" },
  { labelKey: "company.label.representative", valueKey: "company.value.representative" },
  { labelKey: "company.label.contact", value: "hello@unchainedx.io", href: "mailto:hello@unchainedx.io" },
  { labelKey: "company.label.notices", valueKey: "company.value.notices" },
];

export default function CompanyScreen() {
  const { t } = useI18n();
  const footerRef = useFooterAnimation();

  useEffect(() => {
    setAmbientProfile("company");
  }, []);

  return (
    <>
      <ClientOnly fallback={null}>{() => <CompanyScene />}</ClientOnly>

      <div className="fixed md:relative z-30 top-0 left-0 right-0 pt-28 pb-4 px-8 md:px-16">
        <h1
          className="text-4xl md:text-5xl font-bold tracking-wider mb-3 neon-glow-strong"
          style={{ fontFamily: "Rubik, sans-serif", color: "#00F0FF" }}
        >
          Company
        </h1>
      </div>

      <div className="fixed z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 w-full max-w-lg">
        <div className="flex flex-col gap-4 md:gap-6">
          {COMPANY_INFO_KEYS.map((item) => {
            const displayValue = item.valueKey ? t(item.valueKey) : item.value;
            return (
              <div
                key={item.labelKey}
                className="flex flex-col items-center md:items-stretch md:flex-row md:items-baseline gap-1 md:gap-6"
              >
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
                    {displayValue}
                  </a>
                ) : (
                  <span
                    className="text-sm font-mono tracking-wide text-center md:text-left"
                    style={{
                      color: "#E0E0FF",
                      textShadow: "0 0 6px rgba(224,224,255,0.15)",
                    }}
                  >
                    {displayValue}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div ref={footerRef} className="relative z-35 mt-[100vh] pointer-events-auto">
        <Footer />
      </div>
    </>
  );
}
