"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminPanel,
  AdminStatusBadge,
  AdminTableShell,
} from "@/components/admin/adminUi";
import type { AdminConfigCheck } from "@/lib/adminConfigHealth";

export function AdminSettings({ checks }: { checks: AdminConfigCheck[] }) {
  const missing = checks.filter((c) => !c.ok).length;

  return (
    <AdminShell
      title="Paramètres"
      subtitle="Santé de configuration. Les secrets restent côté serveur."
    >
      {missing > 0 ? (
        <AdminBanner tone="error">
          {missing} variable{missing > 1 ? "s" : ""} manquante
          {missing > 1 ? "s" : ""}. Les proxys admin / bêta peuvent échouer.
        </AdminBanner>
      ) : (
        <AdminBanner tone="success">
          Variables critiques présentes. Vérifie aussi Firebase
          (`BETA_WEBSITE_ADMIN_SECRET`).
        </AdminBanner>
      )}

      <AdminTableShell>
        <table>
          <thead>
            <tr>
              <th>Variable</th>
              <th>Hint</th>
              <th>État</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((item) => (
              <tr key={item.id}>
                <td className="font-medium text-white">{item.label}</td>
                <td className="font-mono text-[11px] text-white/40">{item.hint}</td>
                <td>
                  <AdminStatusBadge tone={item.ok ? "success" : "danger"}>
                    {item.ok ? "OK" : "Manquant"}
                  </AdminStatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>

      <AdminPanel
        title="Campagne iOS"
        description="Ouverture TestFlight prévue le 11 août 2026 à 18 h. Actions dans Liste d’attente."
      >
        <p className="text-xs text-white/45">
          Les boutons campagne (annonce, lancement, engagement) sont sur la page Bêta.
        </p>
      </AdminPanel>
    </AdminShell>
  );
}
