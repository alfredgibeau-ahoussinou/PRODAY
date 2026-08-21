import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AccShell } from "@/components/admin/cc/AccShell";
import { AccEmpty, AccPanel } from "@/components/admin/cc/AccUi";
import { loadAccOverview } from "@/lib/adminCc/loadOverview";

export const metadata: Metadata = {
  title: "Support · ProDay Admin",
  robots: { index: false, follow: false },
};

export default async function AccSupportPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) redirect(ADMIN_LOGIN_PATH);
  const ov = await loadAccOverview();
  return (
    <AccShell
      title="Support"
      subtitle="Tickets & incidents — retours bêta comme file réelle actuelle."
      badges={ov.badges}
      healthScore={ov.health.score}
      healthLabel={ov.health.label}
    >
      <AccPanel title="Files">
        <Link
          href="/admin/ops/feedback"
          className="inline-block border border-[var(--acc-line)] px-3 py-2 text-[12px] text-white/70"
        >
          Ouvrir les retours bêta →
        </Link>
        <div className="mt-4">
          <AccEmpty
            title="Helpdesk unifié"
            description="Pas de faux tickets. Brancher une collection support quand disponible."
          />
        </div>
      </AccPanel>
    </AccShell>
  );
}
