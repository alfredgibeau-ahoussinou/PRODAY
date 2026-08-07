import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

/** Legacy /evenements — organisateur = rôle intégré au Club. */
export default function EvenementsRedirectPage() {
  redirect(ROUTES.proClub);
}
