export default function TeamHeader() {
  return (
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
  );
}
