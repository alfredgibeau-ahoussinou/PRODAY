import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AccCommercialPipeline } from "@/components/admin/cc/AccCommercialPipeline";
import { loadAccOverview } from "@/lib/adminCc/loadOverview";

export const metadata: Metadata = {
  title: "Commercial · ProDay Admin",
  robots: { index: false, follow: false },
};

export default async function AccCommercialPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) redirect(ADMIN_LOGIN_PATH);
  const ov = await loadAccOverview();
  return (
    <AccCommercialPipeline
      badges={ov.badges}
      healthScore={ov.health.score}
      healthLabel={ov.health.label}
      pendingBeta={ov.beta.counts.pending}
      clubAccounts={ov.platform.data.users.by_role.club ?? 0}
      betaError={ov.beta.ok ? null : (ov.beta.error ?? "Waitlist indisponible")}
    />
  );
}
