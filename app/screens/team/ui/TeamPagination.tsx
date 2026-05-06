import { playClick } from "~/core/adapters/audio";
import type { TeamMember } from "~/core/adapters/sanity";

interface Props {
  members: TeamMember[];
  currentIndex: number;
  onSelect: (idx: number) => void;
}

export default function TeamPagination({ members, currentIndex, onSelect }: Props) {
  return (
    <div className="fixed z-20 bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1">
      {members.map((m, i) => {
        const isActive = i === currentIndex;
        return (
          <button
            key={`pag-${m.name}`}
            type="button"
            onClick={() => {
              playClick();
              onSelect(i);
            }}
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
        style={{ color: "rgba(0,240,255,0.4)", textShadow: "0 0 6px rgba(0,240,255,0.2)" }}
      >
        {String(currentIndex + 1).padStart(2, "0")} / {String(members.length).padStart(2, "0")}
      </span>
    </div>
  );
}
