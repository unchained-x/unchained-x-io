import type { Project } from "~/lib/sanity.types";

const STATUS_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  "In Dev": {
    bg: "rgba(0, 240, 255, 0.1)",
    text: "#00F0FF",
    glow: "0 0 8px rgba(0, 240, 255, 0.3)",
  },
  Live: {
    bg: "rgba(0, 255, 120, 0.1)",
    text: "#00FF78",
    glow: "0 0 8px rgba(0, 255, 120, 0.3)",
  },
  Archived: {
    bg: "rgba(255, 255, 255, 0.05)",
    text: "rgba(255, 255, 255, 0.4)",
    glow: "none",
  },
};

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const statusStyle = STATUS_COLORS[project.status] || STATUS_COLORS.Archived;

  return (
    <div className="group relative flex-shrink-0 w-[380px] h-[480px]">
      {/* Transparent overlay — 3D washi mesh shows through from PortfolioScene */}
      <div className="relative z-10 flex flex-col h-full p-7">
        {/* Status + Category */}
        <div className="flex justify-between items-start mb-4">
          <span
            className="text-[10px] uppercase tracking-[0.2em] font-mono px-3 py-1 rounded-full"
            style={{
              backgroundColor: statusStyle.bg,
              color: statusStyle.text,
              boxShadow: statusStyle.glow,
            }}
          >
            {project.status}
          </span>

          {project.categories?.length > 0 && project.categories.map((cat) => (
            <span
              key={cat}
              className="text-[10px] uppercase tracking-[0.15em] font-mono"
              style={{ color: "rgba(191, 0, 255, 0.45)" }}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1 mb-4" />

        {/* Title */}
        <h3
          className="text-lg font-bold mb-2 tracking-wide group-hover:text-[#00F0FF] transition-colors duration-300"
          style={{
            fontFamily: "Rubik, sans-serif",
            color: "#E0E0FF",
            textShadow: "0 0 6px rgba(0, 240, 255, 0.08)",
          }}
        >
          {project.title}
        </h3>

        {/* Description */}
        <p
          className="text-xs leading-relaxed mb-4 line-clamp-3"
          style={{ color: "rgba(224, 224, 255, 0.45)" }}
        >
          {project.description}
        </p>

        {/* Technologies */}
        {project.topics?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {project.topics.map((tech) => (
              <span
                key={tech}
                className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-mono"
                style={{
                  backgroundColor: "rgba(0, 240, 255, 0.04)",
                  color: "rgba(0, 240, 255, 0.35)",
                  border: "1px solid rgba(0, 240, 255, 0.05)",
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
