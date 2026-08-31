import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { getAdminConfigHealth } from "@/lib/adminConfigHealth";

export const metadata: Metadata = {
  title: "Système · ProDay Admin",
  robots: { index: false, follow: false },
};

export default async function AccSystemPage() {
  if (!(await getAdminSessionFromCookies())) {
    redirect(ADMIN_LOGIN_PATH);
  }
  return <AdminSettings checks={getAdminConfigHealth()} />;
}
