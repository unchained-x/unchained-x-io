import { useFrame } from "@react-three/fiber";
import { type MutableRefObject, useEffect, useRef } from "react";
import type { Group } from "three";
import type { ScrollPinnedState } from "~/hooks/useScrollPinned";

interface SectionProps {
  children: React.ReactNode;
  groupsRef?: MutableRefObject<(Group | null)[]>;
  index?: number;
}

function Section({ children, groupsRef, index }: SectionProps) {
  const groupRef = useRef<Group>(null);

  useEffect(() => {
    if (groupsRef && index != null) {
      groupsRef.current[index] = groupRef.current;
      return () => { groupsRef.current[index] = null; };
    }
  }, [groupsRef, index]);

  return <group ref={groupRef}>{children}</group>;
}

interface SectionManagerProps {
  sections: React.ReactNode[];
  groupsRef?: MutableRefObject<(Group | null)[]>;
  scrollState: React.RefObject<ScrollPinnedState>;
}

/**
 * Section manager with scroll-driven visibility.
 * Visibility is set in useFrame by reading scrollState ref.
 * All sections are always mounted. Active prop is not used —
 * group.visible controls both rendering and animation skipping.
 */
export default function SectionManager({ sections, groupsRef, scrollState }: SectionManagerProps) {
  useFrame(() => {
    const state = scrollState.current;
    if (!state || !groupsRef) return;

    const groups = groupsRef.current;
    for (let i = 0; i < groups.length; i++) {
      if (!groups[i]) continue;

      if (state.transitionActive) {
        // During transition: both outgoing and incoming visible
        groups[i]!.visible = i === state.outgoingSection || i === state.incomingSection;
      } else {
        // Normal: only active section visible
        groups[i]!.visible = i === state.activeSection;
      }
    }
  });

  return (
    <>
      {sections.map((section, i) => (
        <Section
          key={`section-${i.toString()}`}
          groupsRef={groupsRef}
          index={i}
        >
          {section}
        </Section>
      ))}
    </>
  );
}
