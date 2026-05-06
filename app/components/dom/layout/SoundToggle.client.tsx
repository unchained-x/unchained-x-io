import { useCallback, useState } from "react";
import { isMuted, playClick, startAmbientIfNeeded, toggleMute } from "~/core/adapters/audio";

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(!isMuted());

  const toggle = useCallback(() => {
    const nowMuted = toggleMute();
    setEnabled(!nowMuted);
    if (!nowMuted) {
      playClick();
      startAmbientIfNeeded();
    }
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
            key={`bar-${i}`}
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
