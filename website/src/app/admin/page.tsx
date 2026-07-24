import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";

export const metadata: Metadata = {
  title: "Admin ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminIndexPage() {
  const ok = await getAdminSessionFromCookies();
  redirect(ok ? ADMIN_HOME_PATH : ADMIN_LOGIN_PATH);
}
