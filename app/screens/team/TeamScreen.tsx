import { useEffect } from "react";
import { useLoaderData } from "react-router";
import { ClientOnly } from "remix-utils/client-only";
import Footer from "~/components/dom/layout/Footer";
import { setAmbientProfile } from "~/core/adapters/audio";
import { useCarouselNav } from "~/hooks/useCarouselNav";
import { useFooterAnimation } from "~/hooks/useFooterAnimation";
import type { loader } from "~/routes/team";
import TeamScene from "./scene/TeamScene.client";
import TeamHeader from "./ui/TeamHeader";
import TeamMemberInfo from "./ui/TeamMemberInfo";
import TeamNav from "./ui/TeamNav";
import TeamPagination from "./ui/TeamPagination";

export default function TeamScreen() {
  const { members } = useLoaderData<typeof loader>();
  const footerRef = useFooterAnimation();
  const { currentIndex, goTo, goPrev, goNext } = useCarouselNav(members.length, {
    enableWheel: false,
  });

  useEffect(() => {
    setAmbientProfile("team");
  }, []);

  const member = members[currentIndex];

  return (
    <>
      <ClientOnly fallback={null}>
        {() => <TeamScene members={members} currentIndex={currentIndex} />}
      </ClientOnly>

      <TeamHeader />
      <TeamMemberInfo member={member} />
      <TeamNav currentIndex={currentIndex} total={members.length} onPrev={goPrev} onNext={goNext} />
      <TeamPagination members={members} currentIndex={currentIndex} onSelect={goTo} />

      <div ref={footerRef} className="relative z-35 mt-[100vh] pointer-events-auto">
        <Footer />
      </div>
    </>
  );
}
