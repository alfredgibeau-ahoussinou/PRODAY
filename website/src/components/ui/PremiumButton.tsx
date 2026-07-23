import Link from "next/link";
import { clsx } from "clsx";

type PremiumButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "outline" | "sponsor";
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
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        variant === "primary" &&
          "cta-lift bg-[var(--proday-accent)] text-white shadow-[0_0_0_1px_rgba(0,84,240,0.45),0_12px_40px_-12px_rgba(0,84,240,0.55)] hover:bg-[#2a6fff] hover:shadow-[0_0_0_1px_rgba(76,139,255,0.5),0_16px_48px_-12px_rgba(0,84,240,0.55)] active:translate-y-0 active:bg-[#0046cc] focus-visible:outline-[var(--proday-accent)]/60",
        variant === "ghost" &&
          "bg-white/[0.04] text-white backdrop-blur-sm hover:bg-[var(--proday-accent-muted)] hover:text-[var(--proday-accent)] active:bg-white/10 focus-visible:outline-[var(--proday-accent)]/40",
        variant === "outline" &&
          "border border-white/18 text-white hover:border-[var(--proday-accent)]/70 hover:text-[var(--proday-accent)] hover:shadow-[0_0_28px_rgba(0,84,240,0.18)] active:bg-white/[0.04] focus-visible:outline-[var(--proday-accent)]/40",
        variant === "sponsor" &&
          "bg-[#D4AF37] text-[#0a0a0a] shadow-[0_12px_40px_-12px_rgba(212,175,55,0.45)] hover:bg-[#E0C04A] active:bg-[#C4A030] focus-visible:outline-[#D4AF37]/60",
        className,
      )}
    >
      {children}
    </Link>
  );
}
