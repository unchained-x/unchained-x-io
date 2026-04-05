import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

interface SectionProps {
  visibility: number;
  children: React.ReactNode;
}

function Section({ visibility, children }: SectionProps) {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.visible = visibility > 0.01;
  });

  if (visibility <= 0.01) return null;

  return <group ref={groupRef}>{children}</group>;
}

interface SectionManagerProps {
  progress: number;
  sections: ((visibility: number, transitioning: boolean) => React.ReactNode)[];
  /** Override which section is active (for custom boundaries) */
  activeOverride?: number;
}

export default function SectionManager({ sections, activeOverride }: SectionManagerProps) {
  const sectionCount = sections.length;
  const activeIndex = activeOverride !== undefined ? Math.min(sectionCount - 1, activeOverride) : 0;

  return (
    <>
      {sections.map((renderSection, i) => {
        const isActive = i === activeIndex;
        const visibility = isActive ? 1 : 0;

        return (
          <Section key={`section-${i.toString()}`} visibility={visibility}>
            {renderSection(visibility, false)}
          </Section>
        );
      })}
    </>
  );
}
