import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

/** @deprecated Pôle Amateur fusionné dans Pôle Joueur. */
export default function AmateurRedirectPage() {
  redirect(ROUTES.joueur);
}
