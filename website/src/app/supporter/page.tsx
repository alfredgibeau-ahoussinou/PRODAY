import type { Metadata } from "next";
import { UniversePage } from "@/components/universe/UniversePage";

export const metadata: Metadata = {
  title: "Pro Day Supporter",
  description:
    "Fans et communauté — tribune 100 % gratuite : live scores, suivis, débats et shop merch.",
};

export default function SupporterPage() {
  return <UniversePage universe="supporter" />;
}
