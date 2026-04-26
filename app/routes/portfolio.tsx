import { useCallback, useEffect, useRef, useState } from "react";
import { useFooterAnimation } from "~/hooks/useFooterAnimation";
import { useLoaderData } from "react-router";
import { ClientOnly } from "remix-utils/client-only";
import Footer from "~/components/layout/Footer";
import PortfolioScene from "~/components/portfolio/PortfolioScene.client";
import { playClick, playHover, playSwipe, setAmbientProfile } from "~/lib/audio";
import { sanityClient } from "~/lib/sanity";
import type { Project, ProjectStatus } from "~/lib/sanity.types";
import { seoMeta } from "~/lib/seo";
import type { Route } from "./+types/portfolio";

export function meta(_args: Route.MetaArgs) {
  return seoMeta({
    title: "Portfolio — UnchainedX",
    description: "Project portfolio of UnchainedX — a creative venture studio.",
    path: "/portfolio",
  });
}

const PROJECTS_QUERY = `*[_type == "project"] | order(order asc) {
  _id, title, slug, description, status, categories, thumbnail, url, topics, order
}`;

export async function loader() {
  const projects = await sanityClient.fetch<Project[]>(PROJECTS_QUERY);
  return { projects };
}

const STATUS_OPTIONS: (ProjectStatus | "All")[] = ["All", "In Dev", "Live", "Archived"];

export default function Portfolio() {
  const { projects } = useLoaderData<typeof loader>();
  const [activeStatus, setActiveStatus] = useState<ProjectStatus | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const footerRef = useFooterAnimation();

  useEffect(() => { setAmbientProfile("portfolio"); }, []);

  const filtered = projects.filter((p) => {
    const statusMatch = activeStatus === "All" || p.status === activeStatus;
    const searchMatch = searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return statusMatch && searchMatch;
  });

  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(filtered.length - 1, idx));
    if (clamped !== currentIndexRef.current) playSwipe();
    setCurrentIndex(clamped);
    currentIndexRef.current = clamped;
  }, [filtered.length]);

  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);
  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    currentIndexRef.current = 0;
  }, [activeStatus, searchQuery]);

  // Horizontal wheel navigation
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 30) {
        e.preventDefault();
        if (e.deltaX > 0) goTo(currentIndexRef.current + 1);
        else goTo(currentIndexRef.current - 1);
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [goTo]);

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


  return (
    <>
      {/* 3D Scene */}
      <ClientOnly fallback={null}>
        {() => <PortfolioScene projects={filtered} currentIndex={currentIndex} activeStatus={activeStatus} />}
      </ClientOnly>

      {/* Header */}
      <div className="fixed md:relative z-30 top-0 left-0 right-0 pt-28 pb-4 px-8 md:px-16">
        <h1
          className="text-4xl md:text-5xl font-bold tracking-wider mb-3 neon-glow-strong"
          style={{ fontFamily: "Rubik, sans-serif", color: "#00F0FF" }}
        >
          Portfolio
        </h1>
        <p className="text-sm max-w-xl leading-relaxed mb-6 neon-glow" style={{ color: "rgba(0,240,255,0.6)" }}>
          Projects we&apos;re building, shipping.
        </p>

        {/* Search + Filters */}
        <div className="flex items-center gap-2 md:gap-4 flex-wrap mb-4">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs font-mono px-4 py-2 rounded-full outline-none transition-all duration-300 w-full md:w-48 md:focus:w-64"
              style={{
                backgroundColor: "rgba(0,240,255,0.05)",
                color: "#E0E0FF",
                border: "1px solid rgba(0,240,255,0.1)",
                caretColor: "#00F0FF",
              }}
            />
          </div>

          {/* Status filters */}
          {STATUS_OPTIONS.map((status) => {
            const isActive = activeStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => { playClick(); setActiveStatus(status); }}
                className="text-[11px] uppercase tracking-[0.2em] font-mono px-4 py-1.5 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: isActive ? "rgba(0,240,255,0.1)" : "rgba(255,255,255,0.03)",
                  color: isActive ? "#00F0FF" : "rgba(224,224,255,0.45)",
                  border: `1px solid ${isActive ? "rgba(0,240,255,0.25)" : "rgba(255,255,255,0.08)"}`,
                  boxShadow: isActive ? "0 0 10px rgba(0,240,255,0.15), 0 0 20px rgba(0,240,255,0.06)" : "none",
                  textShadow: isActive ? "0 0 8px rgba(0,240,255,0.4)" : "none",
                }}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation arrows — desktop only */}
      <div className="hidden md:flex fixed z-20 top-1/2 -translate-y-1/2 left-0 right-0 justify-between px-4 md:px-8 pointer-events-none">
        {/* Prev */}
        <button
          type="button"
          onClick={() => { playClick(); goPrev(); }}
          disabled={currentIndex === 0}
          className="group pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            backgroundColor: currentIndex === 0 ? "rgba(255,255,255,0.02)" : "rgba(0,240,255,0.06)",
            border: `1.5px solid ${currentIndex === 0 ? "rgba(255,255,255,0.05)" : "rgba(0,240,255,0.25)"}`,
            color: currentIndex === 0 ? "rgba(255,255,255,0.15)" : "#00F0FF",
            boxShadow: currentIndex === 0 ? "none" : "0 0 12px rgba(0,240,255,0.15), 0 0 25px rgba(0,240,255,0.06), inset 0 0 8px rgba(0,240,255,0.04)",
            backdropFilter: "blur(6px)",
          }}
          onMouseEnter={(e) => {
            playHover();
            if (currentIndex === 0) return;
            const el = e.currentTarget;
            el.style.borderColor = "#E619A0";
            el.style.backgroundColor = "rgba(230,25,150,0.08)";
            el.style.boxShadow = "0 0 12px rgba(230,25,150,0.3), 0 0 30px rgba(230,25,150,0.1), inset 0 0 10px rgba(230,25,150,0.05)";
            el.style.color = "#E619A0";
            el.animate([
              { boxShadow: "0 0 12px rgba(230,25,150,0.3), 0 0 30px rgba(230,25,150,0.1)" },
              { boxShadow: "0 0 18px rgba(230,25,150,0.4), 0 0 40px rgba(230,25,150,0.15)" },
              { boxShadow: "0 0 12px rgba(230,25,150,0.3), 0 0 30px rgba(230,25,150,0.1)" },
            ], { duration: 1200, iterations: Infinity, easing: "ease-in-out" });
          }}
          onMouseLeave={(e) => {
            if (currentIndex === 0) return;
            const el = e.currentTarget;
            el.getAnimations().forEach(a => a.cancel());
            el.style.borderColor = "rgba(0,240,255,0.25)";
            el.style.backgroundColor = "rgba(0,240,255,0.06)";
            el.style.boxShadow = "0 0 12px rgba(0,240,255,0.15), 0 0 25px rgba(0,240,255,0.06), inset 0 0 8px rgba(0,240,255,0.04)";
            el.style.color = "#00F0FF";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 4px currentColor)" }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Next */}
        <button
          type="button"
          onClick={() => { playClick(); goNext(); }}
          disabled={currentIndex >= filtered.length - 1}
          className="group pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            backgroundColor: currentIndex >= filtered.length - 1 ? "rgba(255,255,255,0.02)" : "rgba(0,240,255,0.06)",
            border: `1.5px solid ${currentIndex >= filtered.length - 1 ? "rgba(255,255,255,0.05)" : "rgba(0,240,255,0.25)"}`,
            color: currentIndex >= filtered.length - 1 ? "rgba(255,255,255,0.15)" : "#00F0FF",
            boxShadow: currentIndex >= filtered.length - 1 ? "none" : "0 0 12px rgba(0,240,255,0.15), 0 0 25px rgba(0,240,255,0.06), inset 0 0 8px rgba(0,240,255,0.04)",
            backdropFilter: "blur(6px)",
          }}
          onMouseEnter={(e) => {
            playHover();
            if (currentIndex >= filtered.length - 1) return;
            const el = e.currentTarget;
            el.style.borderColor = "#E619A0";
            el.style.backgroundColor = "rgba(230,25,150,0.08)";
            el.style.boxShadow = "0 0 12px rgba(230,25,150,0.3), 0 0 30px rgba(230,25,150,0.1), inset 0 0 10px rgba(230,25,150,0.05)";
            el.style.color = "#E619A0";
            el.animate([
              { boxShadow: "0 0 12px rgba(230,25,150,0.3), 0 0 30px rgba(230,25,150,0.1)" },
              { boxShadow: "0 0 18px rgba(230,25,150,0.4), 0 0 40px rgba(230,25,150,0.15)" },
              { boxShadow: "0 0 12px rgba(230,25,150,0.3), 0 0 30px rgba(230,25,150,0.1)" },
            ], { duration: 1200, iterations: Infinity, easing: "ease-in-out" });
          }}
          onMouseLeave={(e) => {
            if (currentIndex >= filtered.length - 1) return;
            const el = e.currentTarget;
            el.getAnimations().forEach(a => a.cancel());
            el.style.borderColor = "rgba(0,240,255,0.25)";
            el.style.backgroundColor = "rgba(0,240,255,0.06)";
            el.style.boxShadow = "0 0 12px rgba(0,240,255,0.15), 0 0 25px rgba(0,240,255,0.06), inset 0 0 8px rgba(0,240,255,0.04)";
            el.style.color = "#00F0FF";
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
        {filtered.map((project, i) => {
          const isActive = i === currentIndex;
          return (
            <button
              key={`pag-${project._id}`}
              type="button"
              onClick={() => { playClick(); goTo(i); }}
              className="group relative flex items-center transition-all duration-500 ease-out"
              style={{ height: "32px" }}
            >
              {/* Bar / dot */}
              <div
                className="rounded-full transition-all duration-500 ease-out"
                style={{
                  width: isActive ? "40px" : "8px",
                  height: isActive ? "3px" : "3px",
                  backgroundColor: isActive ? "#00F0FF" : "rgba(255,255,255,0.15)",
                  boxShadow: isActive
                    ? "0 0 8px rgba(0,240,255,0.6), 0 0 20px rgba(0,240,255,0.2)"
                    : "none",
                }}
              />
              {/* Project name tooltip */}
              <span
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 text-[9px] font-mono uppercase tracking-[0.15em] whitespace-nowrap transition-all duration-300 pointer-events-none"
                style={{
                  color: isActive ? "#00F0FF" : "rgba(255,255,255,0.4)",
                  textShadow: isActive ? "0 0 8px rgba(0,240,255,0.5)" : "none",
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? "translateY(0)" : "translateY(4px)",
                }}
              >
                {project.title}
              </span>
              {/* Index number */}
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
        {/* Counter */}
        <span
          className="ml-4 text-[10px] font-mono tracking-wider"
          style={{
            color: "rgba(0,240,255,0.4)",
            textShadow: "0 0 6px rgba(0,240,255,0.2)",
          }}
        >
          {String(currentIndex + 1).padStart(2, "0")} / {String(filtered.length).padStart(2, "0")}
        </span>
      </div>

      {/* Footer */}
      <div ref={footerRef} className="relative z-35 mt-[100vh] pointer-events-auto">
        <Footer />
      </div>
    </>
  );
}
