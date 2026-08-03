import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminSubscriptions } from "@/components/admin/AdminSubscriptions";

export const metadata: Metadata = {
  title: "Abonnements Admin - ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminSubscriptionsPage() {
  if (!(await getAdminSessionFromCookies())) {
    redirect(ADMIN_LOGIN_PATH);
  }
  return <AdminSubscriptions />;
}
