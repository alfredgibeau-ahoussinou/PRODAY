import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

/** Stub retiré du nav HQ — redirige vers le dashboard. */
export default function AdminContentPage() {
  redirect(ROUTES.adminDashboard);
}
