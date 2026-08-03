"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { AdminBanner, AdminPanel } from "@/components/admin/adminUi";

export function AdminSettings() {
  const configured = [
    {
      label: "Session admin (PIN)",
      hint: "BETA_ADMIN_PIN / ADMIN_MINICODE",
      ok: true,
    },
    {
      label: "Secret waitlist site",
      hint: "BETA_WEBSITE_ADMIN_SECRET",
      ok: true,
    },
    {
      label: "URL Cloud Function waitlist",
      hint: "BETA_WAITLIST_ADMIN_FUNCTION_URL",
      ok: true,
    },
    {
      label: "Transport email (Brevo / EmailJS)",
      hint: "email.brevo_api_key ou beta.emailjs_*",
      ok: true,
    },
  ];

  return (
    <AdminShell
      title="Paramètres"
      subtitle="Configuration fondateurs. Les secrets restent côté serveur / Netlify / Firebase."
    >
      <AdminBanner tone="info">
        L’auth admin site reste le minicode partagé. Pas de changement de modèle de session dans
        cette refonte.
      </AdminBanner>

      <div className="grid gap-4 md:grid-cols-2">
        {configured.map((item) => (
          <AdminPanel key={item.label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-white">{item.label}</h2>
                <p className="mt-1 font-mono text-xs text-white/40">{item.hint}</p>
              </div>
              <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-200">
                Requis
              </span>
            </div>
          </AdminPanel>
        ))}
      </div>

      <AdminPanel className="p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold tracking-tight text-white">
          Campagne iOS
        </h2>
        <p className="mt-2 text-sm text-white/55">
          Ouverture TestFlight prévue le 11 août 2026 à 18 h. Les actions de campagne restent dans
          Liste d’attente bêta.
        </p>
      </AdminPanel>
    </AdminShell>
  );
}
