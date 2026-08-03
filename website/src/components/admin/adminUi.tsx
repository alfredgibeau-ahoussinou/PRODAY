import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export type AdminAccent = "blue" | "amber" | "emerald" | "red" | "navy" | "cyan";

const KPI_ACCENTS: Record<AdminAccent, { card: string; bar: string; glow: string }> = {
  blue: {
    card: "border-[#0054F0]/20 bg-[linear-gradient(145deg,rgba(0,84,240,0.14),rgba(8,11,20,0.9)_42%,rgba(8,11,20,0.96))]",
    bar: "bg-[#0054F0]",
    glow: "bg-[#0054F0]/25",
  },
  amber: {
    card: "border-amber-500/20 bg-[linear-gradient(145deg,rgba(245,158,11,0.12),rgba(8,11,20,0.9)_42%,rgba(8,11,20,0.96))]",
    bar: "bg-amber-400",
    glow: "bg-amber-400/20",
  },
  emerald: {
    card: "border-emerald-500/20 bg-[linear-gradient(145deg,rgba(16,185,129,0.12),rgba(8,11,20,0.9)_42%,rgba(8,11,20,0.96))]",
    bar: "bg-emerald-400",
    glow: "bg-emerald-400/20",
  },
  red: {
    card: "border-red-500/20 bg-[linear-gradient(145deg,rgba(239,68,68,0.12),rgba(8,11,20,0.9)_42%,rgba(8,11,20,0.96))]",
    bar: "bg-red-400",
    glow: "bg-red-400/20",
  },
  navy: {
    card: "border-white/10 bg-[linear-gradient(145deg,rgba(76,139,255,0.1),rgba(8,11,20,0.9)_42%,rgba(8,11,20,0.96))]",
    bar: "bg-[#4C8BFF]",
    glow: "bg-[#4C8BFF]/20",
  },
  cyan: {
    card: "border-sky-500/20 bg-[linear-gradient(145deg,rgba(14,165,233,0.12),rgba(8,11,20,0.9)_42%,rgba(8,11,20,0.96))]",
    bar: "bg-sky-400",
    glow: "bg-sky-400/20",
  },
};

export function AdminKpiCard({
  label,
  value,
  hint,
  accent = "blue",
  active = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: AdminAccent;
  /** Highlight when used as a filter chip */
  active?: boolean;
}) {
  const tone = KPI_ACCENTS[accent] ?? KPI_ACCENTS.blue;

  return (
    <div
      className={`admin-kpi relative overflow-hidden rounded-2xl border p-5 transition ${tone.card} ${
        active ? "ring-1 ring-[#4C8BFF]/45 shadow-[0_0_0_1px_rgba(76,139,255,0.15)]" : ""
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-3 left-0 w-[3px] rounded-full ${tone.bar}`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full blur-2xl ${tone.glow}`}
      />
      <p className="pl-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
        {label}
      </p>
      <p className="mt-2.5 pl-2 font-display text-[1.85rem] font-bold leading-none tracking-tight text-white tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-2.5 pl-2 text-xs leading-snug text-white/40">{hint}</p>
      ) : null}
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
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.025] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

export function AdminSectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight text-white">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/45">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function AdminTableShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`admin-table-shell overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#070a12]/80 ${className}`}
    >
      {children}
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 h-px w-10 bg-gradient-to-r from-transparent via-[#4C8BFF]/60 to-transparent" />
      <p className="font-display text-sm font-semibold text-white/70">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-white/40">{description}</p>
      ) : null}
    </div>
  );
}

export type AdminStatusTone = "pending" | "success" | "danger" | "neutral" | "info" | "warning";

const STATUS_TONES: Record<AdminStatusTone, string> = {
  pending: "border-amber-500/25 bg-amber-500/10 text-amber-100",
  success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100",
  danger: "border-red-500/25 bg-red-500/10 text-red-100",
  warning: "border-orange-500/25 bg-orange-500/10 text-orange-100",
  info: "border-[#0054F0]/30 bg-[#0054F0]/12 text-[#9CBCFF]",
  neutral: "border-white/12 bg-white/[0.06] text-white/70",
};

export function AdminStatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: AdminStatusTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${STATUS_TONES[tone]}`}
    >
      {children}
    </span>
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
    info: "border-white/12 bg-white/[0.035] text-white/70",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100",
    error: "border-red-500/30 bg-red-500/10 text-red-200",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function AdminMockBadge() {
  return (
    <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-200">
      Source non branchée
    </span>
  );
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

const BTN_VARIANTS: Record<BtnVariant, string> = {
  primary:
    "border-transparent bg-[#0054F0] text-white hover:bg-[#1a68ff] shadow-[0_0_0_1px_rgba(76,139,255,0.25)]",
  secondary:
    "border-white/12 bg-white/[0.04] text-white/80 hover:border-white/20 hover:bg-white/[0.07] hover:text-white",
  ghost: "border-transparent bg-transparent text-white/60 hover:bg-white/[0.06] hover:text-white",
  danger: "border-transparent bg-red-600 text-white hover:bg-red-500",
  success:
    "border-emerald-500/35 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/20",
};

export function AdminButton({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: "sm" | "md";
}) {
  const sizes =
    size === "sm"
      ? "px-2.5 py-1.5 text-[11px]"
      : "px-4 py-2.5 text-xs";
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border font-bold uppercase tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-45 ${BTN_VARIANTS[variant]} ${sizes} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`admin-field w-full rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#0054F0]/55 focus:ring-2 focus:ring-[#0054F0]/20 ${className}`}
      {...props}
    />
  );
}

export function AdminSelect({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`admin-field rounded-xl border border-white/10 bg-[#0a0e18] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#0054F0]/55 focus:ring-2 focus:ring-[#0054F0]/20 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function AdminFilterChip({
  active,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={`rounded-lg px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition ${
        active
          ? "bg-[#0054F0] text-white shadow-[0_0_0_1px_rgba(76,139,255,0.35)]"
          : "bg-white/[0.05] text-white/55 hover:bg-white/[0.08] hover:text-white"
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminModal({
  title,
  description,
  children,
  footer,
  onClose,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1c] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)]"
      >
        <div className="border-b border-white/[0.07] px-6 py-5">
          <h3 className="font-display text-xl font-bold tracking-tight text-white">{title}</h3>
          {description ? (
            <p className="mt-1.5 text-sm text-white/50">{description}</p>
          ) : null}
        </div>
        {children ? <div className="px-6 py-5">{children}</div> : null}
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-white/[0.07] px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
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
