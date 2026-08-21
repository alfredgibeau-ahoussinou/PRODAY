import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLogs } from "@/components/admin/AdminLogs";
import { fetchAdminAuditLogs } from "@/lib/adminBetaApi";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";

export const metadata: Metadata = {
  title: "Audit · ProDay Admin",
  robots: { index: false, follow: false },
};

export default async function AccAuditPage() {
  if (!(await getAdminSessionFromCookies())) {
    redirect(ADMIN_LOGIN_PATH);
  }
  const result = await fetchAdminAuditLogs();
  return (
    <AdminLogs
      initialEntries={result.entries}
      initialError={result.ok ? null : (result.error ?? "Chargement impossible")}
    />
  );
}
