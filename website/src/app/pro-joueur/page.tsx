import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

/** @deprecated Pôle Pro Joueur fusionné dans Pôle Joueur. */
export default function ProJoueurRedirectPage() {
  redirect(ROUTES.joueur);
}
