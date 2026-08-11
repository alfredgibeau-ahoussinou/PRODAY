import { redirect } from "next/navigation";
import { joueurGateHref } from "@/lib/joueurProfileStorage";

/** @deprecated Pro Day Man → porte Joueur (genre joueur pré-sélectionné). */
export default function HommeRedirectPage() {
  redirect(joueurGateHref({ gender: "men" }));
}
