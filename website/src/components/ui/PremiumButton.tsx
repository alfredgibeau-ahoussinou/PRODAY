import Link from "next/link";
import { clsx } from "clsx";

type PremiumButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "outline";
  className?: string;
};

export function PremiumButton({
  href,
  children,
  variant = "primary",
  className,
}: PremiumButtonProps) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-wide transition duration-300",
        variant === "primary" &&
          "bg-[var(--proday-accent)] text-black shadow-lg shadow-cyan-500/20 hover:scale-[1.02] hover:bg-cyan-300 hover:shadow-cyan-400/30 active:bg-cyan-400",
        variant === "ghost" &&
          "bg-white/5 text-white backdrop-blur-sm hover:bg-[var(--proday-accent-muted)] hover:text-[var(--proday-accent)] active:bg-white/10",
        variant === "outline" &&
          "border border-white/20 text-white hover:border-[var(--proday-accent)] hover:text-[var(--proday-accent)] hover:shadow-[0_0_24px_rgba(34,211,238,0.15)] active:bg-white/5",
        className,
      )}
    >
      {children}
    </Link>
  );
}
