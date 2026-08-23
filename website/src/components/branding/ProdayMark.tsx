"use client";

import Image from "next/image";
import {
  PRODAY_MARK,
  PRODAY_MARK_ASPECT,
  PRODAY_MARK_BY_POLE,
  PRODAY_MARK_ON_LIGHT,
  type ProdayMarkPole,
} from "@/lib/brandingAssets";
import { isExperimentalBrand } from "@/lib/experimentalBrand";

type MarkProps = {
  size?: number;
  className?: string;
  pole?: ProdayMarkPole | "pro_club" | "pro_staff";
  /** Fond clair → symbole noir. */
  variant?: "dark" | "light";
  alt?: string;
  priority?: boolean;
};

function srcForPole(pole: MarkProps["pole"], variant: MarkProps["variant"]): string {
  if (variant === "light") return PRODAY_MARK_ON_LIGHT;
  if (!pole) return PRODAY_MARK;
  if (pole === "pro_club") return PRODAY_MARK_BY_POLE.club;
  if (pole === "pro_staff") return PRODAY_MARK_BY_POLE.coach;
  return PRODAY_MARK_BY_POLE[pole] ?? PRODAY_MARK;
}

/** Symbole officiel ProDay (favicon / pictos pôle). */
export function ProdayMark({
  size = 32,
  className = "",
  pole,
  variant = "dark",
  alt = "ProDay",
  priority = false,
}: MarkProps) {
  const src = srcForPole(pole, variant);
  const height = Math.round(size / PRODAY_MARK_ASPECT);
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={height}
      className={`object-contain ${className}`.trim()}
      priority={priority}
    />
  );
}

type LockupProps = {
  /** Largeur cible du lockup (optionnel). */
  width?: number;
  className?: string;
  /** Fond sombre → blanc ; clair → noir. */
  variant?: "dark" | "light";
  alt?: string;
  priority?: boolean;
};

/** Lockup horizontal symbole + PRODAY (experimental — nav / headers). */
export function ProdayLockup({
  width,
  className = "",
  variant = "dark",
  alt = "ProDay",
  priority = false,
}: LockupProps) {
  const textColor = variant === "light" ? "text-black" : "text-white";
  const markW = Math.round(100 * PRODAY_MARK_ASPECT);

  return (
    <span
      className={`proday-lockup inline-flex items-center gap-[0.32em] text-[22px] leading-none min-[390px]:text-[24px] ${className}`.trim()}
      style={width ? { width } : undefined}
      aria-label={alt}
      role="img"
    >
      <Image
        src={variant === "light" ? PRODAY_MARK_ON_LIGHT : PRODAY_MARK}
        alt=""
        width={markW}
        height={100}
        priority={priority}
        className="h-[0.95em] w-auto shrink-0 object-contain"
      />
      <span
        className={`font-display text-[0.62em] font-bold uppercase tracking-[0.06em] ${textColor}`}
        aria-hidden
      >
        PRODAY
      </span>
    </span>
  );
}

type NavLogoProps = {
  className?: string;
  priority?: boolean;
};

/** Logo nav : symbole seul (prod) ou lockup CSS (experimental). */
export function ProdayNavLogo({ className = "", priority = false }: NavLogoProps) {
  if (isExperimentalBrand()) {
    return (
      <ProdayLockup
        priority={priority}
        className={`h-[22px] text-[22px] min-[390px]:h-[24px] min-[390px]:text-[24px] ${className}`.trim()}
      />
    );
  }

  return (
    <Image
      src={PRODAY_MARK}
      alt=""
      width={28}
      height={20}
      className={`h-5 w-auto object-contain min-[390px]:h-[22px] ${className}`.trim()}
      priority={priority}
    />
  );
}
