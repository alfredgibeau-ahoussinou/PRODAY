import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

/** @deprecated Pro Joueur → porte Qui es-tu ? puis univers adulte. */
export default function ProJoueurRedirectPage() {
  redirect(ROUTES.joueur);
}
