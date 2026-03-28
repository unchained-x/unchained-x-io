import { useCallback, useState } from "react";

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(false);

  const toggle = useCallback(() => {
    setEnabled((prev) => !prev);
    // Audio engine integration will come in Phase 2
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      className="group relative flex items-center gap-2 text-xs uppercase tracking-widest text-text-muted hover:text-neon-cyan transition-colors duration-300"
      aria-label={enabled ? "Mute sound" : "Enable sound"}
    >
      {/* Bars visualizer */}
      <div className="flex items-end gap-[2px] h-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`w-[2px] bg-current transition-all duration-300 ${
              enabled ? "animate-sound-bar" : "h-[2px]"
            }`}
            style={{
              animationDelay: enabled ? `${i * 0.1}s` : undefined,
              height: enabled ? undefined : "2px",
            }}
          />
        ))}
      </div>
      <span className="hidden md:inline">{enabled ? "Sound On" : "Sound Off"}</span>
    </button>
  );
}
