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
        "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition duration-300",
        variant === "primary" &&
          "bg-white text-neutral-950 shadow-lg shadow-white/10 hover:scale-[1.02] hover:bg-neutral-100",
        variant === "ghost" &&
          "bg-white/10 text-white backdrop-blur-sm hover:bg-white/15",
        variant === "outline" &&
          "border border-white/20 text-white hover:border-white/40 hover:bg-white/5",
        className,
      )}
    >
      {children}
    </Link>
  );
}
