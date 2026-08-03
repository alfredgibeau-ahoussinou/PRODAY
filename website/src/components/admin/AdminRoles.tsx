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
      subtitle="Cible produit. Aujourd’hui le site utilise un minicode fondateur unique — pas de comptes rôles live."
    >
      <AdminBanner tone="info">
        Auth actuelle : session PIN fondateur. Cette page décrit la matrice prévue, pas des
        utilisateurs fictifs.
      </AdminBanner>

      <div className="grid gap-4 md:grid-cols-2">
        {ROLES.map((role) => (
          <AdminPanel key={role.id} className="p-5">
            <h2 className="font-display text-lg font-bold text-white">{role.label}</h2>
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
                <td className="text-white/65">{a}</td>
                <td className="text-white/65">{b}</td>
                <td className="text-white/65">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </AdminShell>
  );
}
