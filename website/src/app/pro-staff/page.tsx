import type { Metadata } from "next";
import { UniversePage } from "@/components/universe/UniversePage";

export const metadata: Metadata = {
  title: "Pro Day Pro Staff",
  description:
    "Agent, recruteur, coach pro et organisateur — Mercato Pro et réseau vérifié.",
};

export default function ProStaffPage() {
  return <UniversePage universe="pro_staff" />;
}
