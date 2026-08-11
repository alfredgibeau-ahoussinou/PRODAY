import { redirect } from "next/navigation";
import { joueurGateHref } from "@/lib/joueurProfileStorage";

/** @deprecated ProDay Woman → porte Joueur (genre joueuse pré-sélectionné). */
export default function WomanRedirectPage() {
  redirect(joueurGateHref({ gender: "women" }));
}
