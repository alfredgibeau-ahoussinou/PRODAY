import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

/** @deprecated Pro Day Man fusionné dans Pôle Joueur. */
export default function HommeRedirectPage() {
  redirect(ROUTES.joueur);
}
