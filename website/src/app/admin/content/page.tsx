import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminContent } from "@/components/admin/AdminContent";

export const metadata: Metadata = {
  title: "Gestion Contenu - ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminContentPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) {
    redirect(ADMIN_LOGIN_PATH);
  }

  return <AdminContent />;
}
