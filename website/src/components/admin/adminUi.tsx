import type { ReactNode } from "react";

export function AdminKpiCard({
  label,
  value,
  hint,
  accent = "blue",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "blue" | "amber" | "emerald" | "red" | "violet" | "cyan";
}) {
  const accents: Record<string, string> = {
    blue: "from-[#0054F0]/20 to-transparent border-[#0054F0]/25",
    amber: "from-amber-500/15 to-transparent border-amber-500/25",
    emerald: "from-emerald-500/15 to-transparent border-emerald-500/25",
    red: "from-red-500/15 to-transparent border-red-500/25",
    violet: "from-violet-500/15 to-transparent border-violet-500/25",
    cyan: "from-cyan-500/15 to-transparent border-cyan-500/25",
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-5 ${accents[accent] ?? accents.blue}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-white/45">{hint}</p> : null}
    </div>
  );
}

export function AdminPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/[0.03] ${className}`}
    >
      {children}
    </section>
  );
}

export function AdminTableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
      {children}
    </div>
  );
}

export function AdminBanner({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "error" | "warning";
  children: ReactNode;
}) {
  const tones = {
    info: "border-white/15 bg-white/[0.04] text-white/70",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100",
    error: "border-red-500/30 bg-red-500/10 text-red-200",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>
  );
}

export function AdminMockBadge() {
  return (
    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-200">
      Données démo · API à brancher
    </span>
  );
}

export function formatAdminDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function displayNameFromEmail(email: string, name?: string | null): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const local = email.split("@")[0]?.trim() ?? "";
  if (!local) return "—";
  return local
    .replace(/[._+-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
