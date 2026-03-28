import { Link } from "react-router";
import { ClientOnly } from "remix-utils/client-only";
import MenuIcon from "./MenuIcon.client";
import SoundToggle from "./SoundToggle.client";

interface HeaderProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

export default function Header({ isMenuOpen, onMenuToggle }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-10 md:py-6">
      {/* Logo */}
      <Link
        to="/"
        className="text-lg md:text-xl font-bold tracking-tight text-text hover:text-neon-cyan transition-colors duration-300"
      >
        UnchainedX
      </Link>

      {/* Right side controls */}
      <div className="flex items-center gap-4 md:gap-6">
        <ClientOnly fallback={null}>{() => <SoundToggle />}</ClientOnly>
        <ClientOnly fallback={<div className="w-8 h-8" />}>
          {() => <MenuIcon isOpen={isMenuOpen} onClick={onMenuToggle} />}
        </ClientOnly>
      </div>
    </header>
  );
}
