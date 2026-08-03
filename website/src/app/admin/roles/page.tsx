import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminRoles } from "@/components/admin/AdminRoles";

export const metadata: Metadata = {
  title: "Rôles Admin - ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminRolesPage() {
  if (!(await getAdminSessionFromCookies())) {
    redirect(ADMIN_LOGIN_PATH);
  }
  return <AdminRoles />;
}
