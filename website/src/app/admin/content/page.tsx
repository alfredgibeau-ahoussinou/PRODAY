import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AccShell } from "@/components/admin/cc/AccShell";
import { AccBanner, AccEmpty, AccPanel } from "@/components/admin/cc/AccUi";
import { loadAccOverview } from "@/lib/adminCc/loadOverview";

export const metadata: Metadata = {
  title: "Contenu · ProDay Admin",
  robots: { index: false, follow: false },
};

export default async function AccContentPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) redirect(ADMIN_LOGIN_PATH);
  const ov = await loadAccOverview();
  return (
    <AccShell
      title="Contenu"
      subtitle="Pages, textes, bannières — CMS non branché (pas de fiches démo)."
      badges={ov.badges}
      healthScore={ov.health.score}
      healthLabel={ov.health.label}
    >
      <AccBanner tone="info">
        Le contenu marketing vit dans le code (`content.ts`). Branchez un CMS avant d’éditer ici.
      </AccBanner>
      <AccPanel>
        <AccEmpty
          title="Source éditoriale absente"
          description="Pas de mock. Les pages vitrine restent versionnées dans le repo."
        />
      </AccPanel>
    </AccShell>
  );
}
