"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminEmptyState,
  AdminPanel,
} from "@/components/admin/adminUi";

export function AdminContent() {
  return (
    <AdminShell
      title="Contenu"
      subtitle="FAQ et témoignages du site vitrine."
    >
      <AdminBanner tone="info">
        Aucune source CMS branchée. Les fiches démo ont été retirées.
      </AdminBanner>
      <AdminPanel className="p-0">
        <AdminEmptyState
          title="Connectez la source"
          description="Brancher un CMS ou une collection Firestore avant d’afficher du contenu éditorial ici."
        />
      </AdminPanel>
    </AdminShell>
  );
}
