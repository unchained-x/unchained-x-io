import { seoMeta } from "~/core/services/seo";
import { MerchScreen } from "~/screens/merch";

export function meta() {
  return seoMeta({
    title: "Merch — UnchainedX",
    description: "UnchainedX Merch — UnchainedX, a creative venture studio.",
    path: "/merch",
  });
}

export default function Merch() {
  return <MerchScreen />;
}
