"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle, AlertCircle } from "lucide-react";
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

type PlatformStats = {
  users: number;
  pro: number;
  referrals: number;
  reportsOpen: number;
};

type Props = {
  betaCounts: BetaCounts;
  visitStats: VisitStats;
  platformStats: PlatformStats | null;
  betaError?: string | null;
  visitsError?: string | null;
  platformError?: string | null;
};

const SHORTCUTS = [
  { href: ROUTES.adminBeta, title: "Liste d’attente", desc: "Approuver / refuser" },
  { href: ROUTES.adminFeedback, title: "Retours bêta", desc: "Tickets feedback" },
  { href: ROUTES.adminUsers, title: "Utilisateurs", desc: "Comptes Firestore" },
  { href: ROUTES.adminVisites, title: "Visites", desc: "Site + app" },
  { href: ROUTES.adminReports, title: "Modération", desc: "Signalements" },
  { href: ROUTES.adminLogs, title: "Journal", desc: "Audit admin" },
];

export function AdminDashboard({
  betaCounts,
  visitStats,
  platformStats,
  betaError,
  visitsError,
  platformError,
}: Props) {
  const reportsOpen = platformStats?.reportsOpen ?? 0;

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Ops fondateurs — bêta, trafic, plateforme."
      pendingBetaCount={betaCounts.pending}
    >
      {(betaError || visitsError || platformError) && (
        <div className="space-y-1.5">
          {betaError ? <AdminBanner tone="warning">Bêta : {betaError}</AdminBanner> : null}
          {visitsError ? <AdminBanner tone="warning">Visites : {visitsError}</AdminBanner> : null}
          {platformError ? (
            <AdminBanner tone="warning">Plateforme : {platformError}</AdminBanner>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <AdminKpiCard
          label="Bêta total"
          value={betaCounts.all}
          hint={`${betaCounts.approved} ok · ${betaCounts.rejected} refus`}
          accent="blue"
        />
        <AdminKpiCard
          label="En attente"
          value={betaCounts.pending}
          hint="Priorité"
          accent="amber"
        />
        <AdminKpiCard
          label="Visites site"
          value={visitStats.siteVisits}
          hint={
            visitStats.siteWeek != null ? `${visitStats.siteWeek} / 7j` : "Total"
          }
          accent="navy"
        />
        <AdminKpiCard
          label="Utilisateurs"
          value={platformStats ? platformStats.users : "—"}
          hint={
            platformStats
              ? `${platformStats.pro} Pro · ${visitStats.appOpens} opens app`
              : "—"
          }
          accent="emerald"
        />
      </div>

      <AdminPanel title="À traiter" description="Actions en file.">
        <ul className="divide-y divide-white/10">
          <li>
            <Link
              href={ROUTES.adminBeta}
              className="flex items-center gap-3 px-0 py-2.5 text-sm transition hover:bg-white/[0.02]"
            >
              {betaCounts.pending > 0 ? (
                <AlertCircle size={15} className="shrink-0 text-amber-400" />
              ) : (
                <CheckCircle size={15} className="shrink-0 text-emerald-400" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">
                  {betaCounts.pending > 0
                    ? `${betaCounts.pending} inscription${betaCounts.pending > 1 ? "s" : ""} bêta`
                    : "Aucune inscription en attente"}
                </p>
                <p className="text-[11px] text-white/40">Liste d’attente</p>
              </div>
              <ArrowUpRight size={14} className="text-white/25" />
            </Link>
          </li>
          <li>
            <Link
              href={ROUTES.adminReports}
              className="flex items-center gap-3 px-0 py-2.5 text-sm transition hover:bg-white/[0.02]"
            >
              {reportsOpen > 0 ? (
                <AlertCircle size={15} className="shrink-0 text-amber-400" />
              ) : (
                <CheckCircle size={15} className="shrink-0 text-emerald-400" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">
                  {reportsOpen > 0
                    ? `${reportsOpen} signalement${reportsOpen > 1 ? "s" : ""} ouvert${reportsOpen > 1 ? "s" : ""}`
                    : "Aucun signalement ouvert"}
                </p>
                <p className="text-[11px] text-white/40">Modération</p>
              </div>
              <ArrowUpRight size={14} className="text-white/25" />
            </Link>
          </li>
        </ul>
      </AdminPanel>

      <section>
        <AdminSectionHeading title="Raccourcis" />
        <div className="border border-white/10 bg-[#111114]">
          <ul className="divide-y divide-white/10">
            {SHORTCUTS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-sm transition hover:bg-white/[0.03]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="text-[11px] text-white/40">{item.desc}</p>
                  </div>
                  <ArrowUpRight size={14} className="text-white/25" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <AdminKpiCard
          label="Comptes Pro"
          value={platformStats ? platformStats.pro : "—"}
          accent="emerald"
        />
        <AdminKpiCard
          label="Parrainage"
          value={platformStats ? platformStats.referrals : "—"}
          accent="navy"
        />
        <AdminKpiCard label="App opens" value={visitStats.appOpens} accent="cyan" />
        <AdminKpiCard
          label="MRR"
          value="—"
          hint="RevenueCat"
          accent="blue"
        />
      </div>
    </AdminShell>
  );
}
