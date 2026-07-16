import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

/** Legacy — /partenaires redirige vers /sponsor (next.config). Fallback serveur. */
export default function PartenairesRedirectPage() {
  redirect(ROUTES.sponsor);
}
