import { ClientOnly } from "remix-utils/client-only";
import HomeScene from "~/components/canvas/HomeScene.client";
import { useScrollScene } from "~/hooks/useScrollScene";
import type { Route } from "./+types/home";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "UnchainedX" },
    {
      name: "description",
      content:
        "UnchainedX is a creative venture studio designing and expanding value, networks, and human potential.",
    },
  ];
}

const SECTION_COUNT = 4;

export default function Home() {
  const scrollProgress = useScrollScene({
    sectionCount: SECTION_COUNT,
  });

  return (
    <>
      <ClientOnly fallback={null}>{() => <HomeScene scrollProgress={scrollProgress} />}</ClientOnly>

      <div className="scroll-container relative z-10">
        {Array.from({ length: SECTION_COUNT }, (_, idx) => (
          <section key={`scroll-spacer-${idx.toString()}`} className="scroll-section h-screen" />
        ))}
      </div>
    </>
  );
}
