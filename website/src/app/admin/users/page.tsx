import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { fetchAdminPlatformStats } from "@/lib/adminPlatformApi";

export const metadata: Metadata = {
  title: "Gestion Utilisateurs - ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) {
    redirect(ADMIN_LOGIN_PATH);
  }

  const result = await fetchAdminPlatformStats();

  return (
    <AdminUsers
      users={result.data.users.items}
      totals={{
        total: result.data.users.total,
        active: result.data.users.active,
        inactive: result.data.users.inactive,
      }}
      byRole={result.data.users.by_role}
      truncated={result.data.truncated}
      error={result.ok ? null : (result.error ?? "Chargement impossible")}
    />
  );
}
