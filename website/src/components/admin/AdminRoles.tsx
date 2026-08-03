"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminMockBadge,
  AdminPanel,
  AdminTableShell,
} from "@/components/admin/adminUi";

const ROLES = [
  {
    id: "founder",
    label: "Fondateur",
    perms: ["admin.full", "beta.approve", "beta.reject", "campaigns.run"],
  },
  {
    id: "moderator",
    label: "Modérateur",
    perms: ["reports.read", "reports.action", "content.moderate"],
  },
  {
    id: "support",
    label: "Support",
    perms: ["users.read", "beta.read", "emails.resend"],
  },
  {
    id: "viewer",
    label: "Lecture seule",
    perms: ["dashboard.read", "analytics.read"],
  },
];

export function AdminRoles() {
  return (
    <AdminShell
      title="Rôles & permissions"
      subtitle="Matrice des droits admin. Aujourd’hui le site utilise un minicode fondateur unique."
      actions={<AdminMockBadge />}
    >
      <AdminBanner tone="info">
        Auth actuelle : session PIN fondateur. Hook futur : rôles Firebase Custom Claims +{" "}
        <code className="text-white/80">/api/admin/roles</code>.
      </AdminBanner>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {ROLES.map((role) => (
          <AdminPanel key={role.id} className="p-5">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
              {role.label}
            </h2>
            <p className="mt-1 text-xs uppercase tracking-wide text-white/40">{role.id}</p>
            <ul className="mt-4 space-y-1.5">
              {role.perms.map((p) => (
                <li
                  key={p}
                  className="rounded-lg bg-white/[0.04] px-3 py-2 font-mono text-xs text-[#4C8BFF]"
                >
                  {p}
                </li>
              ))}
            </ul>
          </AdminPanel>
        ))}
      </div>

      <AdminTableShell>
        <table className="mt-8 w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
            <tr>
              <th className="px-4 py-3">Permission</th>
              <th className="px-4 py-3">Fondateur</th>
              <th className="px-4 py-3">Modérateur</th>
              <th className="px-4 py-3">Support</th>
            </tr>
          </thead>
          <tbody className="text-white/70">
            {[
              ["Approuver bêta", "Oui", "Non", "Non"],
              ["Modérer signalements", "Oui", "Oui", "Non"],
              ["Renvoyer emails", "Oui", "Non", "Oui"],
              ["Voir analytics", "Oui", "Oui", "Oui"],
            ].map((row) => (
              <tr key={row[0]} className="border-b border-white/5">
                {row.map((cell) => (
                  <td key={cell} className="px-4 py-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </AdminShell>
  );
}
