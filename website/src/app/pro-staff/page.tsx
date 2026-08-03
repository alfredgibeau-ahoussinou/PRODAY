import type { Metadata } from "next";
import { UniversePage } from "@/components/universe/UniversePage";

export const metadata: Metadata = {
  title: "Pôle Staff — Métiers du foot",
  description:
    "Agent, recruteur, coach. Calendrier structure, convocations premium, Mercato et réseau vérifié. Offre agent 19,99 € (20 premiers).",
};

export default function ProStaffPage() {
  return <UniversePage universe="pro_staff" />;
}
