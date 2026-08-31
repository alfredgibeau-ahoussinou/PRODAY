import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AccClubsPanel } from "@/components/admin/cc/AccClubsPanel";
import { loadAccOverview } from "@/lib/adminCc/loadOverview";

export const metadata: Metadata = {
  title: "Clubs · ProDay Admin",
  robots: { index: false, follow: false },
};

export default async function AccClubsPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) redirect(ADMIN_LOGIN_PATH);
  const ov = await loadAccOverview();
  const clubUsers = ov.platform.data.users.items.filter((u) => u.role === "club");
  const nowMs = Date.now();

  return (
    <Suspense fallback={<div className="p-6 text-sm text-white/40">Chargement…</div>}>
      <AccClubsPanel
        clubUsers={clubUsers}
        badges={ov.badges}
        healthScore={ov.health.score}
        healthLabel={ov.health.label}
        error={ov.platform.ok ? null : (ov.platform.error ?? "Chargement impossible")}
        nowMs={nowMs}
      />
    </Suspense>
  );
}
