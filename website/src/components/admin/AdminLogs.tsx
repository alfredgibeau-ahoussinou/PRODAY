"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminEmptyState,
  AdminPanel,
} from "@/components/admin/adminUi";

export function AdminLogs() {
  return (
    <AdminShell
      title="Logs d’audit"
      subtitle="Journal des actions admin."
    >
      <AdminBanner tone="info">
        Aucune collection d’audit site n’est branchée. Les lignes démo ont été retirées.
      </AdminBanner>
      <AdminPanel className="p-0">
        <AdminEmptyState
          title="Connectez la source"
          description="Prévoir une collection `admin_audit_logs` (ou équivalent) avant d’afficher un journal."
        />
      </AdminPanel>
    </AdminShell>
  );
}
