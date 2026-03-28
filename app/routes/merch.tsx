export function meta() {
  return [{ title: "Merch | UnchainedX" }];
}

export default function Merch() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-neon-purple">Merch</h1>
        <span className="mt-4 inline-block text-sm uppercase tracking-widest text-neon-cyan/60">
          Upcoming
        </span>
      </div>
    </div>
  );
}
