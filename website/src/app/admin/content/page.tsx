import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";

/** Stub retiré de la nav — redirige vers le dashboard. */
export default async function AdminContentRedirectPage() {
  if (!(await getAdminSessionFromCookies())) redirect(ADMIN_LOGIN_PATH);
  redirect(ROUTES.adminDashboard);
}
