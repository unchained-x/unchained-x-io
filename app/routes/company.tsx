import { seoMeta } from "~/core/services/seo";
import { CompanyScreen } from "~/screens/company";

export function meta() {
  return seoMeta({
    title: "Company — UnchainedX",
    description: "Company information — UnchainedX, a creative venture studio.",
    path: "/company",
  });
}

export default function Company() {
  return <CompanyScreen />;
}
