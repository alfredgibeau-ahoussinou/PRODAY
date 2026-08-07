import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

/** Ancien Rôle Santé — redirigé hors vitrine. */
export default function SantePage() {
  redirect(ROUTES.joueur);
}
