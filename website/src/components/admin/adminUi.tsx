import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

export type AdminAccent = "blue" | "amber" | "emerald" | "red" | "navy" | "cyan";

const KPI_BARS: Record<AdminAccent, string> = {
  blue: "bg-[var(--proday-accent)]",
  amber: "bg-amber-400",
  emerald: "bg-emerald-400",
  red: "bg-red-400",
  navy: "bg-[var(--proday-accent-bright)]",
  cyan: "bg-sky-400",
};

/** KPI compact — pas de glow / gradient cinéma */
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
  active?: boolean;
}) {
  return (
    <div
      className={`admin-kpi relative border border-white/10 bg-[#111114] px-3 py-2.5 ${
        active ? "ring-1 ring-[var(--proday-accent-bright)]/50" : ""
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-2 left-0 w-[2px] ${KPI_BARS[accent] ?? KPI_BARS.blue}`}
      />
      <p className="pl-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
        {label}
      </p>
      <p className="mt-1 pl-2.5 font-display text-xl font-medium leading-none tracking-[-0.02em] text-white tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 pl-2.5 text-[11px] leading-snug text-white/35">{hint}</p>
      ) : null}
    </div>
  );
}

export function AdminPanel({
  children,
  className = "",
  title,
  description,
  action,
  bodyClassName = "",
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section className={`border border-white/10 bg-[#111114] ${className}`}>
      {title ? (
        <div className="flex flex-col gap-2 border-b border-white/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-display text-sm font-medium tracking-[-0.02em] text-white">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-[11px] leading-snug text-white/40">{description}</p>
            ) : null}
          </div>
          {action ? <div className="flex flex-wrap items-center gap-1.5">{action}</div> : null}
        </div>
      ) : null}
      {title ? <div className={bodyClassName || "p-3"}>{children}</div> : children}
    </section>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  actions,
  eyebrow = "Admin · ProDay",
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="mb-4 flex flex-col gap-2 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">{eyebrow}</p>
        <h1 className="mt-1 font-display text-xl font-medium tracking-[-0.02em] text-white sm:text-2xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/45">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">{actions}</div>
      ) : null}
    </header>
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
    <div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-display text-sm font-medium tracking-[-0.02em] text-white">{title}</h2>
        {description ? (
          <p className="mt-0.5 max-w-2xl text-[11px] leading-snug text-white/40">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-1.5">{action}</div> : null}
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
      className={`admin-table-shell -mx-3 overflow-x-auto overscroll-x-contain border-y border-white/10 bg-[#0c0c0e] sm:mx-0 sm:border ${className}`}
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
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <p className="text-sm font-medium text-white/65">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-white/35">{description}</p>
      ) : null}
    </div>
  );
}

export type AdminStatusTone = "pending" | "success" | "danger" | "neutral" | "info" | "warning";

const STATUS_TONES: Record<AdminStatusTone, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  danger: "border-red-500/30 bg-red-500/10 text-red-100",
  warning: "border-orange-500/30 bg-orange-500/10 text-orange-100",
  info: "border-[var(--proday-accent)]/35 bg-[var(--proday-accent-muted)] text-[var(--proday-accent-bright)]",
  neutral: "border-white/12 bg-white/[0.05] text-white/65",
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
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${STATUS_TONES[tone]}`}
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
    info: "border-white/10 bg-[#111114] text-white/65",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100",
    error: "border-red-500/30 bg-red-500/10 text-red-200",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  };
  return (
    <div className={`border px-3 py-2 text-xs leading-relaxed ${tones[tone]}`}>{children}</div>
  );
}

export function AdminMockBadge() {
  return (
    <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-amber-200">
      Non branché
    </span>
  );
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

const BTN_VARIANTS: Record<BtnVariant, string> = {
  primary: "border-transparent bg-[var(--proday-accent)] text-white hover:brightness-110",
  secondary:
    "border-white/15 bg-transparent text-white/75 hover:border-white/30 hover:text-white",
  ghost: "border-transparent bg-transparent text-white/55 hover:bg-white/[0.06] hover:text-white",
  danger: "border-transparent bg-red-600 text-white hover:bg-red-500",
  success: "border-emerald-500/35 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/20",
};

export function AdminButton({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: "sm" | "md";
}) {
  const sizes =
    size === "sm"
      ? "min-h-9 px-2.5 text-[10px] sm:h-7 sm:min-h-0"
      : "min-h-10 px-3 text-[11px] sm:h-8 sm:min-h-0";
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded border font-mono font-semibold uppercase tracking-[0.1em] transition disabled:cursor-not-allowed disabled:opacity-45 ${BTN_VARIANTS[variant]} ${sizes} ${className}`}
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
      className={`admin-field h-10 w-full rounded border border-white/15 bg-[#0c0c0e] px-3 text-base text-white outline-none transition placeholder:text-white/30 focus:border-[var(--proday-accent)]/55 sm:h-8 sm:text-sm ${className}`}
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
      className={`admin-field h-10 rounded border border-white/15 bg-[#0c0c0e] px-2.5 text-base text-white outline-none transition focus:border-[var(--proday-accent)]/55 sm:h-8 sm:text-sm ${className}`}
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
      className={`min-h-9 rounded border px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] transition sm:h-7 sm:min-h-0 sm:px-2.5 ${
        active
          ? "border-[var(--proday-accent)] bg-[var(--proday-accent)] text-white"
          : "border-white/15 bg-transparent text-white/50 hover:border-white/30 hover:text-white"
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[92dvh] w-full max-w-md overflow-hidden border border-white/10 bg-[#111114] shadow-2xl sm:rounded-none"
      >
        <div className="border-b border-white/10 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3">
          <h3 className="font-display text-base font-medium tracking-[-0.02em] text-white">
            {title}
          </h3>
          {description ? <p className="mt-1 text-xs text-white/45">{description}</p> : null}
        </div>
        {children ? (
          <div className="max-h-[50dvh] overflow-y-auto overscroll-contain px-4 py-3 sm:max-h-none">
            {children}
          </div>
        ) : null}
        {footer ? (
          <div className="flex flex-col-reverse gap-1.5 border-t border-white/10 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:pb-2.5 [&_button]:min-h-11 sm:[&_button]:min-h-0">
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
