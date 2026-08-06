"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminEmptyState,
  AdminMockBadge,
  AdminPanel,
} from "@/components/admin/adminUi";

export function AdminEmails() {
  return (
    <AdminShell
      title="Emails"
      subtitle="Templates et journaux d’envoi."
      actions={<AdminMockBadge />}
    >
      <AdminBanner tone="info">
        Pas de journal email admin exposé. Les envois bêta restent gérés depuis Liste
        d’attente.
      </AdminBanner>
      <AdminPanel className="p-0">
        <AdminEmptyState
          title="Connectez la source"
          description="Brevo / EmailJS n’exposent pas encore de liste d’envois dans cet admin."
        />
      </AdminPanel>
    </AdminShell>
  );
}
