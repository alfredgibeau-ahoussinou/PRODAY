export function Kicker({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`font-display text-xs font-semibold uppercase tracking-[0.28em] text-white/50 ${className}`}
    >
      {children}
    </p>
  );
}
