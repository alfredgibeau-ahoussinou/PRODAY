"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { useState } from "react";

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
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Link
      href={href}
      className={clsx(
        "cta-lift inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] transition-all",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3AFF]",
        variant === "primary" &&
          "bg-accent-gradient text-white hover:brightness-110",
        variant === "ghost" &&
          "bg-white text-black hover:bg-[#f0f0ea]",
        variant === "outline" &&
          "border border-white/30 text-white hover:border-[#1E3AFF] hover:text-[#5B75FF]",
        variant === "sponsor" &&
          "bg-[#EF4444] text-[#0a0a0a] hover:bg-[#F87171]",
        className,
      )}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      style={{
        transform: isPressed ? "scale(0.97)" : undefined,
      }}
    >
      {children}
    </Link>
  );
}
