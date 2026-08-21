import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AccUsersPanel } from "@/components/admin/cc/AccUsersPanel";
import { loadAccOverview } from "@/lib/adminCc/loadOverview";

export const metadata: Metadata = {
  title: "Utilisateurs · ProDay Admin",
  robots: { index: false, follow: false },
};

export default async function AccUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const ok = await getAdminSessionFromCookies();
  if (!ok) redirect(ADMIN_LOGIN_PATH);
  const sp = await searchParams;
  const ov = await loadAccOverview();
  const users = ov.platform.data.users;

  return (
    <Suspense fallback={<div className="p-6 text-sm text-white/40">Chargement…</div>}>
      <AccUsersPanel
        users={users.items}
        totals={{
          total: users.total,
          active: users.active,
          inactive: users.inactive,
        }}
        byRole={users.by_role}
        truncated={ov.platform.data.truncated}
        error={ov.platform.ok ? null : (ov.platform.error ?? "Chargement impossible")}
        badges={ov.badges}
        healthScore={ov.health.score}
        healthLabel={ov.health.label}
        initialRole={sp.role || "all"}
      />
    </Suspense>
  );
}
