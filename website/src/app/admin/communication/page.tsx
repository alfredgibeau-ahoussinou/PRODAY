import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AccShell } from "@/components/admin/cc/AccShell";
import { AccBanner, AccEmpty, AccPanel } from "@/components/admin/cc/AccUi";
import { loadAccOverview } from "@/lib/adminCc/loadOverview";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Communication · ProDay Admin",
  robots: { index: false, follow: false },
};

export default async function AccCommunicationPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) redirect(ADMIN_LOGIN_PATH);
  const ov = await loadAccOverview();
  return (
    <AccShell
      title="Communication"
      subtitle="Emails & campagnes — EmailJS / CF déjà utilisés pour la bêta."
      badges={ov.badges}
      healthScore={ov.health.score}
      healthLabel={ov.health.label}
    >
      <AccBanner tone="info">
        Les envois waitlist passent par les routes{" "}
        <code className="text-[11px]">/api/admin/beta/*</code>. Pas de faux CRM email.
      </AccBanner>
      <AccPanel title="Raccourcis">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/ops/beta" className="border border-[var(--acc-line)] px-3 py-2 text-[12px] text-white/65">
            Campagnes waitlist
          </Link>
          <Link href="/admin/ops/feedback" className="border border-[var(--acc-line)] px-3 py-2 text-[12px] text-white/65">
            Retours bêta
          </Link>
        </div>
        <div className="mt-4">
          <AccEmpty
            title="Centre campagnes"
            description="Builder multi-segments au backlog — réutilise la config EmailJS existante."
          />
        </div>
      </AccPanel>
    </AccShell>
  );
}
