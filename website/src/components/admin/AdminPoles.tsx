"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminEmptyState,
  AdminPanel,
} from "@/components/admin/adminUi";

export function AdminPoles() {
  return (
    <AdminShell
      title="Pôles & fonctionnalités"
      subtitle="Configuration produit des pôles."
    >
      <AdminBanner tone="info">
        Pas de backend de configuration pôles pour le site admin. Les pôles / features
        démo ont été retirés.
      </AdminBanner>
      <AdminPanel className="p-0">
        <AdminEmptyState
          title="Connectez la source"
          description="La config pôles vit dans le code app — pas de table admin live pour l’instant."
        />
      </AdminPanel>
    </AdminShell>
  );
}
