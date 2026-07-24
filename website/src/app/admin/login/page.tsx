import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminPinGate } from "@/components/admin/AdminPinGate";
import {
  ADMIN_HOME_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";

export const metadata: Metadata = {
  title: "Connexion admin",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await getAdminSessionFromCookies()) {
    redirect(ADMIN_HOME_PATH);
  }
  return <AdminPinGate />;
}
