import { playClick, playHover } from "~/core/adapters/audio";

interface Props {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

function arrowStyle(disabled: boolean): React.CSSProperties {
  return {
    backgroundColor: disabled ? "rgba(255,255,255,0.02)" : "rgba(0,240,255,0.06)",
    border: `1.5px solid ${disabled ? "rgba(255,255,255,0.05)" : "rgba(0,240,255,0.25)"}`,
    color: disabled ? "rgba(255,255,255,0.15)" : "#00F0FF",
    boxShadow: disabled ? "none" : "0 0 12px rgba(0,240,255,0.15), 0 0 25px rgba(0,240,255,0.06), inset 0 0 8px rgba(0,240,255,0.04)",
    backdropFilter: "blur(6px)",
  };
}

export default function TeamNav({ currentIndex, total, onPrev, onNext }: Props) {
  const prevDisabled = currentIndex === 0;
  const nextDisabled = currentIndex >= total - 1;

  return (
    <div className="hidden md:flex fixed z-20 top-1/2 -translate-y-1/2 left-0 right-0 justify-between px-4 md:px-8 pointer-events-none">
      <button
        type="button"
        onClick={() => {
          playClick();
          onPrev();
        }}
        onMouseEnter={() => playHover()}
        disabled={prevDisabled}
        className="group pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
        style={arrowStyle(prevDisabled)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 4px currentColor)" }}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => {
          playClick();
          onNext();
        }}
        onMouseEnter={() => playHover()}
        disabled={nextDisabled}
        className="group pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
        style={arrowStyle(nextDisabled)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 4px currentColor)" }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
