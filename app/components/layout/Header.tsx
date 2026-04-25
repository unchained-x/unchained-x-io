import { Link } from "react-router";
import { ClientOnly } from "remix-utils/client-only";
import { useI18n } from "~/lib/i18n";
import MenuIcon from "./MenuIcon.client";
import SoundToggle from "./SoundToggle.client";

interface HeaderProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
}

function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "ja" : "en")}
      className="text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-1 rounded transition-all duration-300"
      style={{
        color: "rgba(224,224,255,0.5)",
        border: "1px solid rgba(224,224,255,0.1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#00F0FF";
        e.currentTarget.style.borderColor = "rgba(0,240,255,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "rgba(224,224,255,0.5)";
        e.currentTarget.style.borderColor = "rgba(224,224,255,0.1)";
      }}
    >
      {locale === "en" ? "JA" : "EN"}
    </button>
  );
}

export default function Header({ isMenuOpen, onMenuToggle, onMenuClose }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-10 md:py-6">
      {/* Logo */}
      <Link
        to="/"
        onClick={onMenuClose}
        className="text-lg md:text-xl font-bold tracking-tight text-text/60 neon-glow hover:text-neon-cyan hover:neon-glow-strong transition-all duration-500"
      >
        UnchainedX
      </Link>

      {/* Right side controls */}
      <div className="flex items-center gap-4 md:gap-6">
        <LanguageToggle />
        <ClientOnly fallback={null}>{() => <SoundToggle />}</ClientOnly>
        <ClientOnly fallback={<div className="w-8 h-8" />}>
          {() => <MenuIcon isOpen={isMenuOpen} onClick={onMenuToggle} />}
        </ClientOnly>
      </div>
    </header>
  );
}
