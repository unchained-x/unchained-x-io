import gsap from "gsap";
import { useEffect, useRef } from "react";
import { Link } from "react-router";

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { label: "Portfolio", to: "/portfolio" },
  { label: "Team", to: "/team" },
  { label: "Merch", to: "/merch" },
  { label: "Company", to: "/company" },
] as const;

export default function MenuOverlay({ isOpen, onClose }: MenuOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLAnchorElement[]>([]);

  useEffect(() => {
    if (!overlayRef.current) return;

    if (isOpen) {
      gsap.to(overlayRef.current, {
        opacity: 1,
        duration: 0.4,
        ease: "power2.out",
        onStart: () => {
          if (overlayRef.current) overlayRef.current.style.pointerEvents = "auto";
        },
      });

      itemsRef.current.forEach((item, i) => {
        if (!item) return;
        gsap.fromTo(
          item,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            delay: 0.15 + i * 0.08,
            ease: "power3.out",
          },
        );
      });
    } else {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          if (overlayRef.current) overlayRef.current.style.pointerEvents = "none";
        },
      });
    }
  }, [isOpen]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-40 flex items-center justify-center opacity-0 pointer-events-none"
      style={{ background: "rgba(0, 0, 0, 0.95)" }}
    >
      <nav className="flex flex-col items-center gap-8 md:gap-12">
        {MENU_ITEMS.map((item, i) => (
          <Link
            key={item.to}
            to={item.to}
            ref={(el) => {
              if (el) itemsRef.current[i] = el;
            }}
            onClick={onClose}
            className="text-3xl md:text-6xl font-bold uppercase tracking-wider text-text-muted hover:text-neon-cyan transition-colors duration-300 opacity-0"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
