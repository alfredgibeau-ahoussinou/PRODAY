import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AccAiCenter } from "@/components/admin/cc/AccAiCenter";
import { loadAccOverview } from "@/lib/adminCc/loadOverview";

export const metadata: Metadata = {
  title: "Admin AI · ProDay",
  robots: { index: false, follow: false },
};

export default async function AccAiPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) redirect(ADMIN_LOGIN_PATH);
  const ov = await loadAccOverview();
  const contextSummary = [
    `Health ${ov.health.score}% (${ov.health.label}).`,
    `Users ${ov.platform.data.users.total} (${ov.platform.data.users.active} actifs).`,
    `Pro ${ov.platform.data.subscriptions.pro_count}, past_due ${ov.platform.data.subscriptions.past_due}.`,
    `Bêta pending ${ov.beta.counts.pending}.`,
    `Trafic 7j ${ov.siteWeek}, today ${ov.siteToday}.`,
    `Config failing ${ov.configFailing}.`,
  ].join(" ");

  return (
    <AccAiCenter
      badges={ov.badges}
      healthScore={ov.health.score}
      healthLabel={ov.health.label}
      contextSummary={contextSummary}
    />
  );
}
