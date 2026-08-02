"use client";

import { useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { ToastContainer, useToast, toast } from "@/components/admin/Toast";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { Users, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Activity, FileText, Settings, RefreshCw } from "lucide-react";

type BetaCounts = {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
};

type VisitStats = {
  total: number;
  today: number;
  week: number;
};

type Props = {
  betaCounts: BetaCounts;
  visitStats: VisitStats;
};

export function AdminDashboard({ betaCounts, visitStats }: Props) {
  const { toasts, removeToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast("Données actualisées", "success");
    }, 1000);
  };

  const quickActions = [
    { icon: Users, label: "Gérer utilisateurs", href: ROUTES.adminUsers, color: "text-blue-400" },
    { icon: FileText, label: "Gérer contenu", href: ROUTES.adminContent, color: "text-green-400" },
    { icon: Activity, label: "Voir analytics", href: ROUTES.adminAnalytics, color: "text-purple-400" },
    { icon: Settings, label: "Paramètres", href: ROUTES.adminDashboard, color: "text-orange-400" },
  ];

  const statsCards = [
    { icon: Users, label: "Total inscriptions", value: betaCounts.all, color: "bg-blue-500/20 text-blue-400" },
    { icon: Clock, label: "En attente", value: betaCounts.pending, color: "bg-amber-500/20 text-amber-400" },
    { icon: CheckCircle, label: "Approuvés", value: betaCounts.approved, color: "bg-green-500/20 text-green-400" },
    { icon: XCircle, label: "Refusés", value: betaCounts.rejected, color: "bg-red-500/20 text-red-400" },
  ];

  const visitCards = [
    { icon: Activity, label: "Visites totales", value: visitStats.total, color: "bg-purple-500/20 text-purple-400" },
    { icon: TrendingUp, label: "Visites aujourd'hui", value: visitStats.today, color: "bg-cyan-500/20 text-cyan-400" },
    { icon: Clock, label: "Visites cette semaine", value: visitStats.week, color: "bg-pink-500/20 text-pink-400" },
  ];

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <main className="relative mx-auto w-full max-w-7xl px-6 py-12">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-[0.22em] text-[#4C8BFF]">
              Admin · Dashboard
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
              Vue d&apos;ensemble
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/55">
              Statistiques globales et actions rapides pour la gestion de ProDay.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              title="Actualiser"
            >
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
            </button>
            <AdminNav />
          </div>
        </header>

      {/* Statistiques principales */}
      <section className="mt-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-white">Statistiques inscriptions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card, index) => (
            <div
              key={card.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05] hover:scale-105 animate-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`inline-flex rounded-full p-3 ${card.color}`}>
                <card.icon size={24} />
              </div>
              <p className="mt-4 text-sm text-white/60">{card.label}</p>
              <p className="mt-2 font-display text-3xl font-bold text-white">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Statistiques visites */}
      <section className="mt-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-white">Statistiques visites</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {visitCards.map((card, index) => (
            <div
              key={card.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05] hover:scale-105 animate-in slide-in-from-bottom-2"
              style={{ animationDelay: `${(index + 4) * 100}ms` }}
            >
              <div className={`inline-flex rounded-full p-3 ${card.color}`}>
                <card.icon size={24} />
              </div>
              <p className="mt-4 text-sm text-white/60">{card.label}</p>
              <p className="mt-2 font-display text-3xl font-bold text-white">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Actions rapides */}
      <section className="mt-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-white">Actions rapides</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:scale-105 animate-in slide-in-from-left-2"
              style={{ animationDelay: `${(index + 7) * 100}ms` }}
            >
              <div className={`rounded-full p-2 ${action.color}`}>
                <action.icon size={20} />
              </div>
              <span className="font-medium text-white group-hover:text-white/80">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Liens vers les sections détaillées */}
      <section className="mt-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-white">Sections détaillées</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href={ROUTES.adminBeta}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-transparent p-6 transition-all duration-300 hover:border-blue-500/30 hover:scale-105 animate-in slide-in-from-bottom-2"
            style={{ animationDelay: "1100ms" }}
          >
            <div className="flex items-center gap-3">
              <Users className="text-blue-400" size={24} />
              <div>
                <h3 className="font-semibold text-white">Liste d'attente</h3>
                <p className="text-sm text-white/60">Gérer les inscriptions bêta</p>
              </div>
            </div>
          </Link>

          <Link
            href={ROUTES.adminVisites}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-transparent p-6 transition-all duration-300 hover:border-purple-500/30 hover:scale-105 animate-in slide-in-from-bottom-2"
            style={{ animationDelay: "1200ms" }}
          >
            <div className="flex items-center gap-3">
              <Activity className="text-purple-400" size={24} />
              <div>
                <h3 className="font-semibold text-white">Visites</h3>
                <p className="text-sm text-white/60">Analyser le trafic site</p>
              </div>
            </div>
          </Link>

          <Link
            href={ROUTES.adminAnalytics}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-green-500/10 to-transparent p-6 transition-all duration-300 hover:border-green-500/30 hover:scale-105 animate-in slide-in-from-bottom-2"
            style={{ animationDelay: "1300ms" }}
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="text-green-400" size={24} />
              <div>
                <h3 className="font-semibold text-white">Analytics</h3>
                <p className="text-sm text-white/60">Statistiques détaillées</p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Alertes et notifications */}
      <section className="mt-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-white">Alertes</h2>
        {betaCounts.pending > 5 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 animate-in slide-in-from-top-2 duration-300">
            <AlertCircle className="mt-0.5 text-amber-400" size={20} />
            <div>
              <p className="font-medium text-white">Inscriptions en attente</p>
              <p className="text-sm text-white/70">
                {betaCounts.pending} inscriptions nécessitent une validation.
              </p>
              <Link
                href={ROUTES.adminBeta}
                className="mt-2 inline-block text-sm font-medium text-amber-300 hover:text-amber-200"
              >
                Voir la liste d'attente →
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 animate-in slide-in-from-top-2 duration-300">
            <CheckCircle className="text-green-400" size={20} />
            <p className="text-sm text-white/70">Tout est à jour. Aucune action requise.</p>
          </div>
        )}
      </section>
    </main>
    </>
  );
}
