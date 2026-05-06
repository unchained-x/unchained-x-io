import type { ReactNode } from "react";

const HOVER_ANIM = [
  { boxShadow: "inset 0 0 0 1.5px #E619A0, 0 0 6px rgba(230,25,150,0.3)" },
  { boxShadow: "inset 0 0 0 1.5px #8B00FF, 0 0 12px rgba(139,0,255,0.4), 0 0 30px rgba(230,25,150,0.2)" },
  { boxShadow: "inset 0 0 0 1.5px #00F0FF, 0 0 12px rgba(0,240,255,0.4), 0 0 30px rgba(139,0,255,0.15)" },
  { boxShadow: "inset 0 0 0 1.5px #E619A0, 0 0 6px rgba(230,25,150,0.3)" },
];

interface Props {
  href: string;
  children: ReactNode;
}

export default function SocialIconLink({ href, children }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 md:w-9 md:h-9 rounded-full flex items-center justify-center"
      style={{
        border: "1.5px solid rgba(230,25,150,0.5)",
        color: "#E619A0",
        backgroundColor: "transparent",
        filter: "drop-shadow(0 0 4px rgba(230,25,150,0.3))",
        transition: "color 0.3s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.color = "#fff";
        el.style.borderColor = "transparent";
        el.animate(HOVER_ANIM, { duration: 1800, iterations: Infinity, easing: "linear" });
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.getAnimations().forEach((a) => a.cancel());
        el.style.color = "#E619A0";
        el.style.borderColor = "rgba(230,25,150,0.5)";
        el.style.boxShadow = "";
      }}
    >
      {children}
    </a>
  );
}
