import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OpsStatusDashboard } from "@/components/admin/OpsStatusDashboard";
import { loadOpsStatus } from "@/lib/adminOpsStatus";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";

export const metadata: Metadata = {
  title: "Statut Ops · ProDay Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccOpsStatusPage() {
  if (!(await getAdminSessionFromCookies())) {
    redirect(ADMIN_LOGIN_PATH);
  }

  const initialReport = await loadOpsStatus();

  return <OpsStatusDashboard initialReport={initialReport} />;
}
