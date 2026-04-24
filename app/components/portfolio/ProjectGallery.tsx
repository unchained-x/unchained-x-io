import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import type { Project } from "~/lib/sanity.types";
import ProjectCard from "./ProjectCard";

gsap.registerPlugin(ScrollTrigger);

interface ProjectGalleryProps {
  projects: Project[];
}

export default function ProjectGallery({ projects }: ProjectGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track || projects.length === 0) return;

    // Calculate scroll distance
    const trackWidth = track.scrollWidth;
    const viewWidth = container.offsetWidth;
    const scrollDistance = trackWidth - viewWidth;

    if (scrollDistance <= 0) return;

    const tween = gsap.to(track, {
      x: -scrollDistance,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: `+=${scrollDistance}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === container) st.kill();
      });
    };
  }, [projects]);

  return (
    <div ref={containerRef} className="relative overflow-hidden h-screen">
      <div
        ref={trackRef}
        className="flex items-center gap-8 h-full px-12"
        style={{ width: "max-content" }}
      >
        {projects.map((project) => (
          <ProjectCard key={project._id} project={project} />
        ))}
      </div>
    </div>
  );
}
