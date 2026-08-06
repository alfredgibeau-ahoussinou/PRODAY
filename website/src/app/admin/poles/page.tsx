import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";

export default async function AdminPolesRedirectPage() {
  if (!(await getAdminSessionFromCookies())) redirect(ADMIN_LOGIN_PATH);
  redirect(ROUTES.adminDashboard);
}
