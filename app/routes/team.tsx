import { listTeamMembers, type TeamMember } from "~/core/adapters/sanity";
import { seoMeta } from "~/core/services/seo";
import { TeamScreen } from "~/screens/team";

export function meta() {
  return seoMeta({
    title: "Team — UnchainedX",
    description: "The pack behind UnchainedX — a creative venture studio.",
    path: "/team",
  });
}

const HIRING_MEMBER: TeamMember = {
  name: "Open Position",
  role: "Join the pack",
  animal: "egg",
  isHiring: true,
};

export async function loader() {
  try {
    const members = await listTeamMembers();
    members.push(HIRING_MEMBER);
    return { members };
  } catch {
    return { members: [HIRING_MEMBER] };
  }
}

export default function Team() {
  return <TeamScreen />;
}
