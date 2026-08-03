import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

/** @deprecated ProDay Woman fusionné dans Pôle Joueur. */
export default function WomanRedirectPage() {
  redirect(ROUTES.joueur);
}
