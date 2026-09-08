import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AccShell } from "@/components/admin/cc/AccShell";
import { AccBanner, AccPanel } from "@/components/admin/cc/AccUi";
import { loadAccOverview } from "@/lib/adminCc/loadOverview";

export const metadata: Metadata = {
  title: "Produit · ProDay Admin",
  robots: { index: false, follow: false },
};

export default async function AccProductPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) redirect(ADMIN_LOGIN_PATH);
  const ov = await loadAccOverview();

  return (
    <AccShell
      title="Produit · Modules & pôles"
      subtitle="Cartographie écosystème ProDay — flags runtime = app Admin."
      badges={ov.badges}
      healthScore={ov.health.score}
      healthLabel={ov.health.label}
    >
      <AccBanner tone="info">
        Cartographie des pôles marketing / produit. Les kill-switches runtime et modules app
        se pilotent dans l’Espace Admin Expo (Remote Config), pas via des toggles site.
      </AccBanner>
      <AccPanel title="Pôles">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {["Joueur", "Club", "Coach", "Parent", "Supporter", "Sponsor", "Président"].map(
            (p) => (
              <div
                key={p}
                className="border border-[var(--acc-line)] bg-[var(--acc-surface-2)] px-3 py-3 text-sm text-white/75"
              >
                {p}
              </div>
            ),
          )}
        </div>
        <Link
          href="/admin/product/flags"
          className="mt-4 inline-block text-[12px] text-[var(--acc-steel)] hover:underline"
        >
          Catalogue feature flags (lecture seule) →
        </Link>
      </AccPanel>
    </AccShell>
  );
}
