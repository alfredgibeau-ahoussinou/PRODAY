import type { Metadata } from "next";
import { UniversePage } from "@/components/universe/UniversePage";

export const metadata: Metadata = {
  title: "Pro Day Supporter",
  description:
    "Fans et communauté. Tribune 100 % gratuite : live, suivis, débats et shop.",
};

export default function SupporterPage() {
  return <UniversePage universe="supporter" />;
}
