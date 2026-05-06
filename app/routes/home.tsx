import { HomeScreen } from "~/screens/home";
import { seoMeta } from "~/core/services/seo";
import type { Route } from "./+types/home";

export function meta(_args: Route.MetaArgs) {
  return seoMeta({
    title: "UnchainedX — Creative Venture Studio",
    description: "UnchainedX is a creative venture studio designing and expanding value, networks, and human potential.",
    path: "/",
  });
}

export default function Home() {
  return <HomeScreen />;
}
