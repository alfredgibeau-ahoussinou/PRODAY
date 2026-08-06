"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminEmptyState,
  AdminMockBadge,
  AdminPanel,
} from "@/components/admin/adminUi";

export function AdminPoles() {
  return (
    <AdminShell
      title="Pôles & fonctionnalités"
      subtitle="Configuration produit des pôles."
      actions={<AdminMockBadge />}
    >
      <AdminBanner tone="info">
        Pas de backend de configuration pôles pour le site admin.
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
