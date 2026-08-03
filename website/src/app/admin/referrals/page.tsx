import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminReferrals } from "@/components/admin/AdminReferrals";

export const metadata: Metadata = {
  title: "Parrainage Admin - ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminReferralsPage() {
  if (!(await getAdminSessionFromCookies())) {
    redirect(ADMIN_LOGIN_PATH);
  }
  return <AdminReferrals />;
}
