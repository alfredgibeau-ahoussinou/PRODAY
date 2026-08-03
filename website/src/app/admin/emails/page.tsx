import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminEmails } from "@/components/admin/AdminEmails";

export const metadata: Metadata = {
  title: "Gestion Emails - ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminEmailsPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) {
    redirect(ADMIN_LOGIN_PATH);
  }

  return <AdminEmails />;
}
