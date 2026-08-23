"use client";

import Image from "next/image";
import {
  PRODAY_LOCKUP_ASPECT,
  PRODAY_LOGO_ON_DARK,
  PRODAY_LOGO_ON_LIGHT,
  PRODAY_MARK,
  PRODAY_MARK_ASPECT,
  PRODAY_MARK_BY_POLE,
  type ProdayMarkPole,
} from "@/lib/brandingAssets";

type MarkProps = {
  size?: number;
  className?: string;
  pole?: ProdayMarkPole | "pro_club" | "pro_staff";
  alt?: string;
  priority?: boolean;
};

function srcForPole(pole: MarkProps["pole"]): string {
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
  alt = "ProDay",
  priority = false,
}: MarkProps) {
  const src = srcForPole(pole);
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
  /** Largeur CSS du lockup (hauteur dérivée du ratio). */
  width?: number;
  className?: string;
  /** Fond sombre → lockup blanc ; clair → lockup noir. */
  variant?: "dark" | "light";
  alt?: string;
  priority?: boolean;
};

/** Lockup horizontal symbole + PRODAY (nav / headers). */
export function ProdayLockup({
  width = 120,
  className = "",
  variant = "dark",
  alt = "ProDay",
  priority = false,
}: LockupProps) {
  const src = variant === "light" ? PRODAY_LOGO_ON_LIGHT : PRODAY_LOGO_ON_DARK;
  const height = Math.round(width / PRODAY_LOCKUP_ASPECT);
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`h-auto w-auto object-contain ${className}`.trim()}
      style={{ width, height: "auto", maxHeight: height }}
      priority={priority}
    />
  );
}
