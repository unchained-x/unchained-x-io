import { useCallback, useEffect, useRef, useState } from "react";
import { useFooterAnimation } from "~/hooks/useFooterAnimation";
import { useLoaderData } from "react-router";
import { ClientOnly } from "remix-utils/client-only";
import Footer from "~/components/layout/Footer";
import { playClick, playHover, playSwipe, setAmbientProfile } from "~/lib/audio";
import { sanityClient } from "~/lib/sanity";
import TeamScene from "~/components/team/TeamScene.client";

import { seoMeta } from "~/lib/seo";

export function meta() {
  return seoMeta({
    title: "Team — UnchainedX",
    description: "The pack behind UnchainedX — a creative venture studio.",
    path: "/team",
  });
}

interface SanityMember {
  name: string;
  roles: string[];
  animal: string;
  links?: { twitter?: string; github?: string; website?: string };
}

interface MemberInfo {
  name: string;
  role: string;
  animal: string;
  isHiring?: boolean;
  links?: { twitter?: string; github?: string; website?: string };
}

const HIRING_MEMBER: MemberInfo = {
  name: "Open Position",
  role: "Join the pack",
  animal: "egg",
  isHiring: true,
};

const MEMBERS_QUERY = `*[_type == "teamMember"] | order(order asc) {
  name, roles, animal, links, order
}`;

export async function loader() {
  try {
    const sanityMembers = await sanityClient.fetch<SanityMember[]>(MEMBERS_QUERY);
    const members: MemberInfo[] = sanityMembers.map((m) => ({
      name: m.name,
      role: m.roles.join(" / "),
      animal: m.animal,
      links: m.links,
    }));
    members.push(HIRING_MEMBER);
    return { members };
  } catch {
    return { members: [HIRING_MEMBER] };
  }
}

export default function Team() {
  const { members } = useLoaderData<typeof loader>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const footerRef = useFooterAnimation();

  useEffect(() => { setAmbientProfile("team"); }, []);

  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(members.length - 1, idx));
    if (clamped !== currentIndexRef.current) playSwipe();
    setCurrentIndex(clamped);
    currentIndexRef.current = clamped;
  }, [members.length]);

  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);
  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);

  // Touch swipe navigation
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) goTo(currentIndexRef.current + 1);
        else goTo(currentIndexRef.current - 1);
      }
    };
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(currentIndexRef.current + 1);
      else if (e.key === "ArrowLeft") goTo(currentIndexRef.current - 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goTo]);


  const member = members[currentIndex];
  const isHiring = member.isHiring === true;

  return (
    <>
      {/* 3D Scene */}
      <ClientOnly fallback={null}>
        {() => <TeamScene members={members} currentIndex={currentIndex} />}
      </ClientOnly>

      {/* Header */}
      <div className="fixed md:relative z-30 top-0 left-0 right-0 pt-28 pb-4 px-8 md:px-16">
        <h1
          className="text-4xl md:text-5xl font-bold tracking-wider mb-3 neon-glow-strong"
          style={{ fontFamily: "Rubik, sans-serif", color: "#00F0FF" }}
        >
          Team
        </h1>
        <p className="text-sm max-w-xl leading-relaxed neon-glow" style={{ color: "rgba(0,240,255,0.6)" }}>
          The pack.
        </p>
      </div>

      {/* Member info overlay — bottom center */}
      <div className="fixed z-10 bottom-20 left-1/2 -translate-x-1/2 text-center">
        {/* Name */}
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

        {/* Role */}
        <p
          className="text-xs font-mono uppercase tracking-[0.25em] mb-4"
          style={{
            color: isHiring ? "rgba(191,0,255,0.6)" : "#BF00FF",
            textShadow: isHiring ? "0 0 6px rgba(191,0,255,0.3)" : "0 0 8px rgba(191,0,255,0.4)",
          }}
        >
          {isHiring ? "Join the pack" : member.role}
        </p>

        {/* Links */}
        {!isHiring && member.links && (
          <div className="flex justify-center gap-4">
            {member.links.twitter && (
              <a
                href={member.links.twitter}
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
                  el.animate([
                    { boxShadow: "inset 0 0 0 1.5px #E619A0, 0 0 6px rgba(230,25,150,0.3)" },
                    { boxShadow: "inset 0 0 0 1.5px #8B00FF, 0 0 12px rgba(139,0,255,0.4), 0 0 30px rgba(230,25,150,0.2)" },
                    { boxShadow: "inset 0 0 0 1.5px #00F0FF, 0 0 12px rgba(0,240,255,0.4), 0 0 30px rgba(139,0,255,0.15)" },
                    { boxShadow: "inset 0 0 0 1.5px #E619A0, 0 0 6px rgba(230,25,150,0.3)" },
                  ], { duration: 1800, iterations: Infinity, easing: "linear" });
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.getAnimations().forEach(a => a.cancel());
                  el.style.color = "#E619A0";
                  el.style.borderColor = "rgba(230,25,150,0.5)";
                  el.style.boxShadow = "";
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
            {member.links.github && (
              <a
                href={member.links.github}
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
                  el.animate([
                    { boxShadow: "inset 0 0 0 1.5px #E619A0, 0 0 6px rgba(230,25,150,0.3)" },
                    { boxShadow: "inset 0 0 0 1.5px #8B00FF, 0 0 12px rgba(139,0,255,0.4), 0 0 30px rgba(230,25,150,0.2)" },
                    { boxShadow: "inset 0 0 0 1.5px #00F0FF, 0 0 12px rgba(0,240,255,0.4), 0 0 30px rgba(139,0,255,0.15)" },
                    { boxShadow: "inset 0 0 0 1.5px #E619A0, 0 0 6px rgba(230,25,150,0.3)" },
                  ], { duration: 1800, iterations: Infinity, easing: "linear" });
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.getAnimations().forEach(a => a.cancel());
                  el.style.color = "#E619A0";
                  el.style.borderColor = "rgba(230,25,150,0.5)";
                  el.style.boxShadow = "";
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            )}
            {member.links.website && (
              <a
                href={member.links.website}
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
                  el.animate([
                    { boxShadow: "inset 0 0 0 1.5px #E619A0, 0 0 6px rgba(230,25,150,0.3)" },
                    { boxShadow: "inset 0 0 0 1.5px #8B00FF, 0 0 12px rgba(139,0,255,0.4), 0 0 30px rgba(230,25,150,0.2)" },
                    { boxShadow: "inset 0 0 0 1.5px #00F0FF, 0 0 12px rgba(0,240,255,0.4), 0 0 30px rgba(139,0,255,0.15)" },
                    { boxShadow: "inset 0 0 0 1.5px #E619A0, 0 0 6px rgba(230,25,150,0.3)" },
                  ], { duration: 1800, iterations: Infinity, easing: "linear" });
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.getAnimations().forEach(a => a.cancel());
                  el.style.color = "#E619A0";
                  el.style.borderColor = "rgba(230,25,150,0.5)";
                  el.style.boxShadow = "";
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </a>
            )}
          </div>
        )}

        {/* Hiring CTA */}
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
              el.animate([
                { boxShadow: "inset 0 0 0 1.5px #E619A0, 0 0 6px rgba(230,25,150,0.3)" },
                { boxShadow: "inset 0 0 0 1.5px #8B00FF, 0 0 12px rgba(139,0,255,0.4), 0 0 30px rgba(230,25,150,0.2)" },
                { boxShadow: "inset 0 0 0 1.5px #00F0FF, 0 0 12px rgba(0,240,255,0.4), 0 0 30px rgba(139,0,255,0.15)" },
                { boxShadow: "inset 0 0 0 1.5px #E619A0, 0 0 6px rgba(230,25,150,0.3)" },
              ], { duration: 1800, iterations: Infinity, easing: "linear" });
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.getAnimations().forEach(a => a.cancel());
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

      {/* Navigation arrows — desktop only */}
      <div className="hidden md:flex fixed z-20 top-1/2 -translate-y-1/2 left-0 right-0 justify-between px-4 md:px-8 pointer-events-none">
        <button
          type="button"
          onClick={() => { playClick(); goPrev(); }}
          onMouseEnter={() => playHover()}
          disabled={currentIndex === 0}
          className="group pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            backgroundColor: currentIndex === 0 ? "rgba(255,255,255,0.02)" : "rgba(0,240,255,0.06)",
            border: `1.5px solid ${currentIndex === 0 ? "rgba(255,255,255,0.05)" : "rgba(0,240,255,0.25)"}`,
            color: currentIndex === 0 ? "rgba(255,255,255,0.15)" : "#00F0FF",
            boxShadow: currentIndex === 0 ? "none" : "0 0 12px rgba(0,240,255,0.15), 0 0 25px rgba(0,240,255,0.06), inset 0 0 8px rgba(0,240,255,0.04)",
            backdropFilter: "blur(6px)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 4px currentColor)" }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => { playClick(); goNext(); }}
          onMouseEnter={() => playHover()}
          disabled={currentIndex >= members.length - 1}
          className="group pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            backgroundColor: currentIndex >= members.length - 1 ? "rgba(255,255,255,0.02)" : "rgba(0,240,255,0.06)",
            border: `1.5px solid ${currentIndex >= members.length - 1 ? "rgba(255,255,255,0.05)" : "rgba(0,240,255,0.25)"}`,
            color: currentIndex >= members.length - 1 ? "rgba(255,255,255,0.15)" : "#00F0FF",
            boxShadow: currentIndex >= members.length - 1 ? "none" : "0 0 12px rgba(0,240,255,0.15), 0 0 25px rgba(0,240,255,0.06), inset 0 0 8px rgba(0,240,255,0.04)",
            backdropFilter: "blur(6px)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 4px currentColor)" }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Pagination */}
      <div className="fixed z-20 bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1">
        {members.map((m, i) => {
          const isActive = i === currentIndex;
          return (
            <button
              key={`pag-${m.name}`}
              type="button"
              onClick={() => { playClick(); goTo(i); }}
              className="group relative flex items-center transition-all duration-500 ease-out"
              style={{ height: "32px" }}
            >
              <div
                className="rounded-full transition-all duration-500 ease-out"
                style={{
                  width: isActive ? "40px" : "8px",
                  height: "3px",
                  backgroundColor: isActive ? "#00F0FF" : "rgba(255,255,255,0.15)",
                  boxShadow: isActive ? "0 0 8px rgba(0,240,255,0.6), 0 0 20px rgba(0,240,255,0.2)" : "none",
                }}
              />
              <span
                className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[8px] font-mono transition-all duration-300"
                style={{
                  color: isActive ? "rgba(0,240,255,0.6)" : "rgba(255,255,255,0.1)",
                  textShadow: isActive ? "0 0 4px rgba(0,240,255,0.3)" : "none",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </button>
          );
        })}
        <span
          className="ml-4 text-[10px] font-mono tracking-wider"
          style={{
            color: "rgba(0,240,255,0.4)",
            textShadow: "0 0 6px rgba(0,240,255,0.2)",
          }}
        >
          {String(currentIndex + 1).padStart(2, "0")} / {String(members.length).padStart(2, "0")}
        </span>
      </div>

      {/* Footer */}
      <div ref={footerRef} className="relative z-35 mt-[100vh] pointer-events-auto">
        <Footer />
      </div>
    </>
  );
}
