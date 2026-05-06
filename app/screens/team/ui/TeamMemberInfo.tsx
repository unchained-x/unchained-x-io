import type { TeamMember } from "~/core/adapters/sanity";
import SocialIconLink from "./SocialIconLink";

const HOVER_ANIM = [
  { boxShadow: "inset 0 0 0 1.5px #E619A0, 0 0 6px rgba(230,25,150,0.3)" },
  { boxShadow: "inset 0 0 0 1.5px #8B00FF, 0 0 12px rgba(139,0,255,0.4), 0 0 30px rgba(230,25,150,0.2)" },
  { boxShadow: "inset 0 0 0 1.5px #00F0FF, 0 0 12px rgba(0,240,255,0.4), 0 0 30px rgba(139,0,255,0.15)" },
  { boxShadow: "inset 0 0 0 1.5px #E619A0, 0 0 6px rgba(230,25,150,0.3)" },
];

interface Props {
  member: TeamMember;
}

export default function TeamMemberInfo({ member }: Props) {
  const isHiring = member.isHiring === true;

  return (
    <div className="fixed z-10 bottom-20 left-1/2 -translate-x-1/2 text-center">
      <h2
        className="text-3xl md:text-4xl font-bold tracking-wide mb-2"
        style={{
          fontFamily: "Rubik, sans-serif",
          color: isHiring ? "rgba(0,240,255,0.7)" : "#00F0FF",
          textShadow: isHiring
            ? "0 0 10px rgba(0,240,255,0.4), 0 0 20px rgba(0,240,255,0.15)"
            : "0 0 12px rgba(0,240,255,0.5), 0 0 24px rgba(0,240,255,0.2)",
        }}
      >
        {isHiring ? "You?" : member.name}
      </h2>

      <p
        className="text-xs font-mono uppercase tracking-[0.25em] mb-4"
        style={{
          color: isHiring ? "rgba(191,0,255,0.6)" : "#BF00FF",
          textShadow: isHiring ? "0 0 6px rgba(191,0,255,0.3)" : "0 0 8px rgba(191,0,255,0.4)",
        }}
      >
        {isHiring ? "Join the pack" : member.role}
      </p>

      {!isHiring && member.links && (
        <div className="flex justify-center gap-4">
          {member.links.twitter && (
            <SocialIconLink href={member.links.twitter}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </SocialIconLink>
          )}
          {member.links.github && (
            <SocialIconLink href={member.links.github}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </SocialIconLink>
          )}
          {member.links.website && (
            <SocialIconLink href={member.links.website}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </SocialIconLink>
          )}
        </div>
      )}

      {isHiring && (
        <a
          href="mailto:hello@unchainedx.io"
          className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full inline-block"
          style={{
            color: "#E619A0",
            border: "1.5px solid rgba(230,25,150,0.5)",
            textShadow: "0 0 8px rgba(230,25,150,0.5), 0 0 16px rgba(230,25,150,0.2)",
            boxShadow: "0 0 6px rgba(230,25,150,0.2), 0 0 15px rgba(230,25,150,0.08)",
            backgroundColor: "transparent",
            transition: "color 0.3s ease",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.color = "#fff";
            el.style.textShadow = "0 0 8px rgba(230,25,150,0.8), 0 0 16px rgba(230,25,150,0.4), 0 0 30px rgba(230,25,150,0.2)";
            el.style.borderColor = "transparent";
            el.animate(HOVER_ANIM, { duration: 1800, iterations: Infinity, easing: "linear" });
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.getAnimations().forEach((a) => a.cancel());
            el.style.color = "#E619A0";
            el.style.textShadow = "0 0 8px rgba(230,25,150,0.5), 0 0 16px rgba(230,25,150,0.2)";
            el.style.borderColor = "rgba(230,25,150,0.5)";
            el.style.boxShadow = "0 0 6px rgba(230,25,150,0.2), 0 0 15px rgba(230,25,150,0.08)";
          }}
        >
          Get in touch →
        </a>
      )}
    </div>
  );
}
