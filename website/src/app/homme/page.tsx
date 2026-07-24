import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

/** Legacy. fusionné dans le pôle Amateur (genre à l'inscription). */
export default function HommeLegacyPage() {
  redirect(ROUTES.amateur);
}
