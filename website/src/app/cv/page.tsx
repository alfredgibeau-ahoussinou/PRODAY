import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

/** CV joueur → pôle Joueur (page marketing dédiée retirée). */
export default function CvRedirectPage() {
  redirect(ROUTES.joueur);
}
