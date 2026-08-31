import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AccShell } from "@/components/admin/cc/AccShell";
import { AccPanel } from "@/components/admin/cc/AccUi";
import { loadAccOverview } from "@/lib/adminCc/loadOverview";

export const metadata: Metadata = {
  title: "Sécurité · ProDay Admin",
  robots: { index: false, follow: false },
};

export default async function AccSecurityPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) redirect(ADMIN_LOGIN_PATH);
  const ov = await loadAccOverview();
  return (
    <AccShell
      title="Sécurité · Rôles & permissions"
      subtitle="RBAC fondateurs — session PIN HMAC. Rôles granulaires = backlog (super admin / commercial / modérateur)."
      badges={ov.badges}
      healthScore={ov.health.score}
      healthLabel={ov.health.label}
    >
      <AccPanel title="Rôles prévus">
        <ul className="grid gap-2 sm:grid-cols-2">
          {["Super Admin", "Commercial", "Finance", "Modérateur", "Support", "Lecture seule"].map(
            (r) => (
              <li
                key={r}
                className="border border-[var(--acc-line)] bg-[var(--acc-surface-2)] px-3 py-2.5 text-sm text-white/70"
              >
                {r}
              </li>
            ),
          )}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/security/audit" className="border border-[var(--acc-line)] px-3 py-2 text-[12px] text-white/65">
            Audit →
          </Link>
          <Link href="/admin/security/reports" className="border border-[var(--acc-line)] px-3 py-2 text-[12px] text-white/65">
            Modération →
          </Link>
        </div>
      </AccPanel>
    </AccShell>
  );
}
