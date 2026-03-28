import type { Route } from "./+types/home";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "UnchainedX — Font Preview" }, { name: "description", content: "Font preview" }];
}

export default function Home() {
  return (
    <div className="min-h-screen p-8 md:p-16 space-y-12">
      <p className="text-xs uppercase tracking-widest text-neon-cyan/60">
        Rubik (clean base) — glitch will be added via WebGPU shader
      </p>

      {/* Heading weights */}
      <h1 className="text-6xl md:text-8xl font-bold">UnchainedX</h1>
      <h2 className="text-4xl md:text-6xl font-semibold">Breaking Chains. Building Futures.</h2>
      <h3 className="text-2xl md:text-4xl font-medium">Creative Venture Studio</h3>

      {/* Body */}
      <p className="text-lg leading-relaxed max-w-2xl">
        We are a creative venture studio designing and expanding value, networks, and human
        potential through technology and creativity.
      </p>

      <p className="text-base leading-relaxed max-w-2xl text-text-muted">
        Unchained from convention. Driven by experimentation. We design systems that amplify what
        humans and networks can become.
      </p>

      {/* Nav items */}
      <div className="flex gap-6 text-sm uppercase tracking-wider pt-4 border-t border-border">
        <span className="text-neon-cyan">Portfolio</span>
        <span className="text-neon-purple">Team</span>
        <span className="text-text-muted">Merch</span>
        <span className="text-text-muted">GET IN TOUCH</span>
      </div>

      <p className="text-xs text-text-muted">© 2025 UnchainedX Inc.</p>
    </div>
  );
}
