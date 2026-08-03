"use client";

import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CheckCircle,
  ClipboardList,
  CreditCard,
  Gift,
  Users,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminKpiCard,
  AdminPanel,
  AdminSectionHeading,
} from "@/components/admin/adminUi";
import { ROUTES } from "@/lib/routes";

type BetaCounts = {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
};

type VisitStats = {
  siteVisits: number;
  appOpens: number;
  siteToday?: number;
  siteWeek?: number;
};

type Props = {
  betaCounts: BetaCounts;
  visitStats: VisitStats;
  betaError?: string | null;
  visitsError?: string | null;
};

export function AdminDashboard({
  betaCounts,
  visitStats,
  betaError,
  visitsError,
}: Props) {
  return (
    <AdminShell
      title="Dashboard"
      subtitle="Vue d’ensemble des inscriptions bêta, du trafic et des files d’attente fondateurs."
      pendingBetaCount={betaCounts.pending}
    >
      {(betaError || visitsError) && (
        <div className="space-y-2">
          {betaError ? <AdminBanner tone="warning">Bêta : {betaError}</AdminBanner> : null}
          {visitsError ? (
            <AdminBanner tone="warning">Visites : {visitsError}</AdminBanner>
          ) : null}
        </div>
      )}

      <section>
        <AdminSectionHeading
          title="Indicateurs clés"
          description="Priorité : file d’attente bêta et trafic."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminKpiCard
            label="Inscriptions bêta"
            value={betaCounts.all}
            hint={`${betaCounts.approved} approuvés · ${betaCounts.rejected} refusés`}
            accent="blue"
          />
          <AdminKpiCard
            label="En attente"
            value={betaCounts.pending}
            hint="Action prioritaire"
            accent="amber"
          />
          <AdminKpiCard
            label="Visites site"
            value={visitStats.siteVisits}
            hint={
              visitStats.siteWeek != null
                ? `${visitStats.siteWeek} sur 7 jours`
                : "Total suivi"
            }
            accent="navy"
          />
          <AdminKpiCard
            label="Ouvertures app"
            value={visitStats.appOpens}
            hint="Tracking Firebase"
            accent="cyan"
          />
        </div>
      </section>

      <section>
        {betaCounts.pending > 0 ? (
          <AdminBanner tone="warning">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              <div>
                <p className="font-medium text-amber-50">
                  {betaCounts.pending} inscription
                  {betaCounts.pending > 1 ? "s" : ""} en attente d’accès bêta
                </p>
                <Link
                  href={ROUTES.adminBeta}
                  className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-amber-200 transition hover:text-white"
                >
                  Ouvrir la liste d’attente
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </AdminBanner>
        ) : (
          <AdminBanner tone="success">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              Aucune inscription en attente.
            </div>
          </AdminBanner>
        )}
      </section>

      <section>
        <AdminSectionHeading
          title="Raccourcis"
          description="Accès rapide aux modules fondateurs."
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            {
              href: ROUTES.adminBeta,
              icon: ClipboardList,
              title: "Liste d’attente",
              desc: "Approuver / refuser avec note interne",
            },
            {
              href: ROUTES.adminUsers,
              icon: Users,
              title: "Utilisateurs",
              desc: "Comptes, rôles et suspension",
            },
            {
              href: ROUTES.adminSubscriptions,
              icon: CreditCard,
              title: "Abonnements",
              desc: "Plans Free / Pro (hooks Stripe)",
            },
            {
              href: ROUTES.adminReferrals,
              icon: Gift,
              title: "Parrainage",
              desc: "Codes et récompenses",
            },
            {
              href: ROUTES.adminVisites,
              icon: Activity,
              title: "Visites",
              desc: "Trafic site et ouvertures app",
            },
            {
              href: ROUTES.adminReports,
              icon: AlertCircle,
              title: "Modération",
              desc: "Signalements et files",
            },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="group block">
              <AdminPanel className="h-full p-5 transition group-hover:border-[#0054F0]/35 group-hover:bg-white/[0.04]">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0054F0]/15 text-[#7AA7FF] ring-1 ring-[#0054F0]/20 transition group-hover:bg-[#0054F0] group-hover:text-white">
                    <item.icon size={18} />
                  </span>
                  <ArrowUpRight
                    size={16}
                    className="text-white/25 transition group-hover:text-[#7AA7FF]"
                  />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold tracking-tight text-white">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-white/45">{item.desc}</p>
              </AdminPanel>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AdminKpiCard
          label="Abonnements (Stripe)"
          value="—"
          hint="À brancher sur Stripe"
          accent="blue"
        />
        <AdminKpiCard
          label="Revenu estimé"
          value="—"
          hint="Nécessite Stripe Billing API"
          accent="navy"
        />
      </section>
    </AdminShell>
  );
}
