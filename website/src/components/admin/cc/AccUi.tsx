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
    <header className="mb-4 flex flex-col gap-3 border-b border-[var(--acc-line)] pb-4 lg:mb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--acc-mute)]">
          {eyebrow}
        </p>
        <h1 className="mt-1 font-display text-2xl font-medium tracking-[-0.03em] text-white sm:text-[1.75rem]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/45">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function AccPanel({
  children,
  title,
  description,
  action,
  className = "",
  bodyClassName = "p-3 sm:p-4",
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`acc-panel border border-[var(--acc-line)] bg-[var(--acc-surface)] ${className}`}>
      {title ? (
        <div className="flex flex-col gap-2 border-b border-[var(--acc-line)] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="min-w-0">
            <h2 className="font-display text-sm font-medium tracking-[-0.02em] text-white">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-[11px] leading-snug text-white/40">{description}</p>
            ) : null}
          </div>
          {action ? <div className="flex flex-wrap gap-1.5">{action}</div> : null}
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
      ? "bg-amber-400"
      : tone === "teal"
        ? "bg-teal-400"
        : tone === "red"
          ? "bg-rose-400"
          : tone === "blue"
            ? "bg-[var(--proday-accent-bright)]"
            : "bg-white/25";
  return (
    <div className="relative border border-[var(--acc-line)] bg-[var(--acc-surface-2)] px-3 py-2.5">
      <span aria-hidden className={`absolute inset-y-2 left-0 w-[2px] ${bar}`} />
      <p className="pl-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
        {label}
      </p>
      <p className="mt-1 pl-2.5 font-display text-xl font-medium tabular-nums tracking-[-0.02em] text-white">
        {value}
      </p>
      {hint ? <p className="mt-1 pl-2.5 text-[11px] text-white/35">{hint}</p> : null}
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
          : "border-[var(--acc-line)] bg-white/[0.03] text-white/70";
  return <div className={`border px-3 py-2 text-xs leading-relaxed ${styles}`}>{children}</div>;
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
    "inline-flex min-h-10 items-center justify-center gap-1.5 px-3 text-[13px] font-medium transition disabled:opacity-40";
  const v =
    variant === "ghost"
      ? "border border-[var(--acc-line)] text-white/70 hover:bg-white/[0.04] hover:text-white"
      : variant === "danger"
        ? "bg-rose-600 text-white hover:bg-rose-500"
        : "bg-[var(--proday-accent)] text-white hover:bg-[var(--proday-accent-dim)]";
  return (
    <button type={type} className={`${base} ${v} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function AccInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-10 w-full border border-[var(--acc-line)] bg-[var(--acc-bg)] px-3 text-base text-white outline-none transition placeholder:text-white/30 focus:border-[var(--proday-accent)]/55 sm:h-9 sm:text-sm ${className}`}
      {...props}
    />
  );
}

export function AccSelect({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-10 w-full border border-[var(--acc-line)] bg-[var(--acc-bg)] px-3 text-base text-white outline-none focus:border-[var(--proday-accent)]/55 sm:h-9 sm:text-sm ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function AccEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="font-display text-sm text-white">{title}</p>
      <p className="mt-1 text-xs text-white/40">{description}</p>
    </div>
  );
}

export function AccTable({ children }: { children: ReactNode }) {
  return <div className="admin-table-shell overflow-x-auto">{children}</div>;
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
      ? "bg-teal-500/15 text-teal-200"
      : tone === "warning"
        ? "bg-amber-500/15 text-amber-100"
        : tone === "danger"
          ? "bg-rose-500/15 text-rose-100"
          : tone === "info"
            ? "bg-[var(--proday-accent)]/20 text-[var(--proday-accent-bright)]"
            : "bg-white/10 text-white/55";
  return (
    <span className={`inline-flex px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${c}`}>
      {children}
    </span>
  );
}
