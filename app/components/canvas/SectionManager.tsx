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

  return <group ref={groupRef}>{children}</group>;
}

interface SectionManagerProps {
  progress: number;
  sections: ((visibility: number, transitioning: boolean) => React.ReactNode)[];
  boundaries: number[];
}

/**
 * Crossfade section manager.
 * Sections are always mounted (never unmounted).
 * Visibility is controlled via group.visible.
 */
export default function SectionManager({ progress, sections, boundaries }: SectionManagerProps) {
  const starts = [0, ...boundaries];
  const ends = [...boundaries, 1];
  const transitionWidth = 0.08;

  return (
    <>
      {sections.map((renderSection, i) => {
        const sectionStart = starts[i];
        const sectionEnd = ends[i];

        let visibility = 0;

        if (progress >= sectionStart && progress <= sectionEnd) {
          const fadeInEnd = sectionStart + transitionWidth;
          const fadeOutStart = sectionEnd - transitionWidth;

          if (progress < fadeInEnd && i > 0) {
            visibility = (progress - sectionStart) / transitionWidth;
          } else if (progress > fadeOutStart && i < sections.length - 1) {
            visibility = (sectionEnd - progress) / transitionWidth;
          } else {
            visibility = 1;
          }
        }

        visibility = Math.max(0, Math.min(1, visibility));
        const transitioning = visibility > 0.01 && visibility < 0.99;

        if (i === 2 && Math.random() < 0.02) {
          console.log(
            `[Identity] vis=${visibility.toFixed(3)} progress=${progress.toFixed(3)} start=${sectionStart} end=${sectionEnd}`,
          );
        }

        return (
          <Section key={`section-${i.toString()}`} visibility={visibility}>
            {renderSection(visibility, transitioning)}
          </Section>
        );
      })}
    </>
  );
}
