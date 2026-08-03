"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminMockBadge } from "@/components/admin/adminUi";
import { TrendingUp, Users, Eye, MousePointer, Clock, BarChart3, Calendar, Download } from "lucide-react";

interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: Array<{ path: string; views: number; percentage: number }>;
  trafficSources: Array<{ source: string; percentage: number }>;
  deviceBreakdown: Array<{ device: string; percentage: number }>;
  dailyStats: Array<{ date: string; views: number; visitors: number }>;
}

const mockAnalytics: AnalyticsData = {
  pageViews: 15420,
  uniqueVisitors: 8934,
  avgSessionDuration: 245,
  bounceRate: 42.3,
  topPages: [
    { path: "/", views: 5234, percentage: 34 },
    { path: "/beta/inscription", views: 3120, percentage: 20 },
    { path: "/pro-joueur", views: 2180, percentage: 14 },
    { path: "/faq", views: 1540, percentage: 10 },
    { path: "/tarifs", views: 1230, percentage: 8 },
  ],
  trafficSources: [
    { source: "Direct", percentage: 45 },
    { source: "Google", percentage: 30 },
    { source: "Social", percentage: 15 },
    { source: "Referral", percentage: 10 },
  ],
  deviceBreakdown: [
    { device: "Mobile", percentage: 62 },
    { device: "Desktop", percentage: 28 },
    { device: "Tablet", percentage: 10 },
  ],
  dailyStats: [
    { date: "2024-07-20", views: 2100, visitors: 1200 },
    { date: "2024-07-21", views: 2300, visitors: 1350 },
    { date: "2024-07-22", views: 1950, visitors: 1100 },
    { date: "2024-07-23", views: 2400, visitors: 1400 },
    { date: "2024-07-24", views: 2200, visitors: 1280 },
    { date: "2024-07-25", views: 2500, visitors: 1450 },
    { date: "2024-07-26", views: 1970, visitors: 1154 },
  ],
};

export function AdminAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">("7d");
  const [analytics] = useState<AnalyticsData>(mockAnalytics);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <AdminShell
      title="Analytics"
      subtitle="Trafic et performance (données démo). Hook: GET /api/admin/analytics."
      actions={<AdminMockBadge />}
    >

      {/* Sélecteur de période */}
      <section className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${
                selectedPeriod === period
                  ? "bg-white text-black"
                  : "bg-white/[0.06] text-white/60 hover:text-white"
              }`}
            >
              {period === "7d" ? "7 jours" : period === "30d" ? "30 jours" : "90 jours"}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white/70 transition hover:bg-white/10 hover:text-white">
          <Download size={16} />
          Exporter
        </button>
      </section>

      {/* KPIs principaux */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-500/20 p-3">
              <Eye className="text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-sm text-white/60">Vues de pages</p>
              <p className="mt-1 font-display text-2xl font-bold text-white">
                {analytics.pageViews.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-green-400">+12.5% vs période précédente</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[#0054F0]/20 p-3">
              <Users className="text-[#7AA7FF]" size={20} />
            </div>
            <div>
              <p className="text-sm text-white/60">Visiteurs uniques</p>
              <p className="mt-1 font-display text-2xl font-bold text-white">
                {analytics.uniqueVisitors.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-green-400">+8.3% vs période précédente</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-cyan-500/20 p-3">
              <Clock className="text-cyan-400" size={20} />
            </div>
            <div>
              <p className="text-sm text-white/60">Durée moyenne</p>
              <p className="mt-1 font-display text-2xl font-bold text-white">
                {formatDuration(analytics.avgSessionDuration)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-green-400">+15.2% vs période précédente</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-500/20 p-3">
              <MousePointer className="text-amber-400" size={20} />
            </div>
            <div>
              <p className="text-sm text-white/60">Taux de rebond</p>
              <p className="mt-1 font-display text-2xl font-bold text-white">
                {analytics.bounceRate}%
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-red-400">+3.1% vs période précédente</p>
        </div>
      </section>

      {/* Pages les plus visitées */}
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-white">Pages les plus visitées</h2>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Page
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Vues
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Pourcentage
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Progression
                </th>
              </tr>
            </thead>
            <tbody>
              {analytics.topPages.map((page, index) => (
                <tr key={index} className="border-b border-white/5 last:border-0">
                  <td className="px-6 py-4">
                    <span className="font-medium text-white">{page.path}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white/80">{page.views.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${page.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-white/60">{page.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-green-400">+{Math.floor(Math.random() * 20) + 5}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sources de trafic et appareils */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-white">Sources de trafic</h3>
          <div className="space-y-4">
            {analytics.trafficSources.map((source, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">{source.source}</span>
                  <span className="text-sm font-medium text-white">{source.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[#0038B0] to-[#0054F0]"
                    style={{ width: `${source.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-white">Appareils</h3>
          <div className="space-y-4">
            {analytics.deviceBreakdown.map((device, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">{device.device}</span>
                  <span className="text-sm font-medium text-white">{device.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-green-500"
                    style={{ width: `${device.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Évolution journalière */}
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-white">Évolution journalière</h2>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-end gap-2 h-48">
            {analytics.dailyStats.map((stat, index) => {
              const maxViews = Math.max(...analytics.dailyStats.map((s) => s.views));
              const height = (stat.views / maxViews) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col gap-1">
                    <div
                      className="w-full rounded-t bg-blue-500/60 hover:bg-blue-500 transition cursor-pointer"
                      style={{ height: `${height * 0.7}%` }}
                      title={`${stat.views} vues`}
                    />
                    <div
                      className="w-full rounded-b bg-sky-500/50 transition hover:bg-sky-400 cursor-pointer"
                      style={{ height: `${height * 0.3}%` }}
                      title={`${stat.visitors} visiteurs`}
                    />
                  </div>
                  <span className="text-xs text-white/40">
                    {new Date(stat.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-blue-500/60" />
              <span className="text-xs text-white/60">Vues</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-sky-500/60" />
              <span className="text-xs text-white/60">Visiteurs</span>
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
