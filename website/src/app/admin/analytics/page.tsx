import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";

export const metadata: Metadata = {
  title: "Analytics - ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) {
    redirect(ADMIN_LOGIN_PATH);
  }

  return <AdminAnalytics />;
}
