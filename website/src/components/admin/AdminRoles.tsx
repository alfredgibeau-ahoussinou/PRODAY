"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminPanel,
  AdminTableShell,
} from "@/components/admin/adminUi";

/** Matrice documentaire des droits futurs — pas des stats inventées. */
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
      subtitle="Cible produit. Aujourd’hui : minicode fondateur unique."
    >
      <AdminBanner tone="info">
        Auth actuelle : session PIN. Cette page décrit la matrice prévue.
      </AdminBanner>

      <div className="grid gap-2 md:grid-cols-2">
        {ROLES.map((role) => (
          <AdminPanel key={role.id} title={role.label} description={role.id}>
            <ul className="flex flex-wrap gap-1">
              {role.perms.map((p) => (
                <li
                  key={p}
                  className="rounded border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-white/60"
                >
                  {p}
                </li>
              ))}
            </ul>
          </AdminPanel>
        ))}
      </div>

      <AdminTableShell>
        <table className="min-w-[640px]">
          <thead>
            <tr>
              <th>Permission</th>
              <th>Fondateur</th>
              <th>Modérateur</th>
              <th>Support</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Approuver bêta", "Oui", "Non", "Non"],
              ["Modérer signalements", "Oui", "Oui", "Non"],
              ["Lire utilisateurs", "Oui", "Oui", "Oui"],
              ["Campagnes iOS", "Oui", "Non", "Non"],
            ].map(([perm, a, b, c]) => (
              <tr key={perm}>
                <td className="text-white">{perm}</td>
                <td>{a}</td>
                <td>{b}</td>
                <td>{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </AdminShell>
  );
}
