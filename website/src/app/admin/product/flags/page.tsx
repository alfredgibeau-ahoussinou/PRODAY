import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AccFeatureFlags } from "@/components/admin/cc/AccFeatureFlags";
import { loadAccOverview } from "@/lib/adminCc/loadOverview";

export const metadata: Metadata = {
  title: "Feature flags · ProDay Admin",
  robots: { index: false, follow: false },
};

export default async function AccFlagsPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) redirect(ADMIN_LOGIN_PATH);
  const ov = await loadAccOverview();
  return (
    <AccFeatureFlags
      badges={ov.badges}
      healthScore={ov.health.score}
      healthLabel={ov.health.label}
    />
  );
}
