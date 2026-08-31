import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AccDevisCenter } from "@/components/admin/cc/AccDevisCenter";
import { loadAccOverview } from "@/lib/adminCc/loadOverview";

export const metadata: Metadata = {
  title: "Devis · ProDay Admin",
  robots: { index: false, follow: false },
};

export default async function AccDevisPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) redirect(ADMIN_LOGIN_PATH);
  const ov = await loadAccOverview();
  return (
    <AccDevisCenter
      badges={ov.badges}
      healthScore={ov.health.score}
      healthLabel={ov.health.label}
      pendingBeta={ov.beta.counts.pending}
    />
  );
}
