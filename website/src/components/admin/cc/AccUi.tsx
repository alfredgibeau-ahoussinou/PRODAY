"use client";

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

export function AccPageHeader({
  eyebrow = "Control Center",
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-[var(--acc-line)] pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--proday-accent-bright)]" />
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--acc-mute)]">
            {eyebrow}
          </p>
        </div>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/50">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </header>
  );
}

export function AccPanel({
  children,
  title,
  description,
  action,
  className = "",
  bodyClassName = "p-4 sm:p-5",
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`acc-panel rounded-xl border border-[var(--acc-line)] bg-[var(--acc-surface)] transition-all hover:border-[var(--acc-line-highlight)] ${className}`}>
      {title ? (
        <div className="flex flex-col gap-2.5 border-b border-[var(--acc-line)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <h2 className="font-display text-sm font-semibold tracking-tight text-white">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs leading-snug text-white/45">{description}</p>
            ) : null}
          </div>
          {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
        </div>
      ) : null}
      {title ? <div className={bodyClassName}>{children}</div> : children}
    </section>
  );
}

export function AccMetric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "amber" | "teal" | "red" | "blue";
}) {
  const bar =
    tone === "amber"
      ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]"
      : tone === "teal"
        ? "bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.4)]"
        : tone === "red"
          ? "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.4)]"
          : tone === "blue"
            ? "bg-[var(--proday-accent-bright)] shadow-[0_0_8px_rgba(99,102,241,0.4)]"
            : "bg-white/20";
  return (
    <div className="group relative rounded-xl border border-[var(--acc-line)] bg-[var(--acc-surface-2)] p-4 transition-all hover:border-[var(--acc-line-highlight)] hover:bg-[var(--acc-surface-2)]/80">
      <span aria-hidden className={`absolute bottom-3 left-0 top-3 w-1 rounded-r ${bar}`} />
      <p className="pl-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-white/50">
        {label}
      </p>
      <p className="mt-1.5 pl-2 font-display text-2xl font-bold tabular-nums tracking-tight text-white sm:text-[1.65rem]">
        {value}
      </p>
      {hint ? <p className="mt-1.5 pl-2 text-xs text-white/40">{hint}</p> : null}
    </div>
  );
}

export function AccBanner({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "warning" | "error" | "success";
}) {
  const styles =
    tone === "warning"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
      : tone === "error"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
        : tone === "success"
          ? "border-teal-500/30 bg-teal-500/10 text-teal-100"
          : "border-[var(--acc-line)] bg-white/[0.03] text-white/75";
  return <div className={`rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed ${styles}`}>{children}</div>;
}

export function AccButton({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const base =
    "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-xs font-semibold tracking-wide transition-all active:scale-[0.98] disabled:opacity-40";
  const v =
    variant === "ghost"
      ? "border border-[var(--acc-line)] bg-white/[0.02] text-white/80 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
      : variant === "danger"
        ? "bg-rose-600/90 text-white shadow-sm hover:bg-rose-500"
        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:from-blue-500 hover:to-indigo-500";
  return (
    <button type={type} className={`${base} ${v} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function AccInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-9 w-full rounded-lg border border-[var(--acc-line)] bg-black/30 px-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/40 ${className}`}
      {...props}
    />
  );
}

export function AccSelect({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-9 w-full rounded-lg border border-[var(--acc-line)] bg-black/30 px-3 text-sm text-white outline-none transition focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/40 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function AccEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--acc-line)] px-4 py-12 text-center">
      <p className="font-display text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-white/45">{description}</p>
    </div>
  );
}

export function AccTable({ children }: { children: ReactNode }) {
  return <div className="admin-table-shell overflow-x-auto rounded-xl border border-[var(--acc-line)]">{children}</div>;
}

export function AccStatus({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const c =
    tone === "success"
      ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
      : tone === "warning"
        ? "bg-amber-500/15 text-amber-200 border border-amber-500/30"
        : tone === "danger"
          ? "bg-rose-500/15 text-rose-200 border border-rose-500/30"
          : tone === "info"
            ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
            : "bg-white/10 text-white/60 border border-white/10";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${c}`}>
      {children}
    </span>
  );
}
