import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminUsers } from "@/components/admin/AdminUsers";

export const metadata: Metadata = {
  title: "Gestion Utilisateurs - ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) {
    redirect(ADMIN_LOGIN_PATH);
  }

  return <AdminUsers />;
}
