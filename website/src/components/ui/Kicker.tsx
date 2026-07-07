export function Kicker({
  children,
  className = "",
  centered = false,
}: {
  children: React.ReactNode;
  className?: string;
  centered?: boolean;
}) {
  return (
    <p
      className={`kicker-flash font-display text-xs font-bold uppercase tracking-[0.32em] text-[var(--proday-accent)] ${centered ? "text-center" : ""} ${className}`}
    >
      {children}
    </p>
  );
}
