"use client";

import Image from "next/image";
import { PRODAY_MARK, PRODAY_MARK_BY_POLE, type ProdayMarkPole } from "@/lib/brandingAssets";

type Props = {
  /** Taille CSS du côté long (largeur). */
  size?: number;
  className?: string;
  /** Teinte pôle optionnelle (même symbole). */
  pole?: ProdayMarkPole | "pro_club" | "pro_staff";
  alt?: string;
  priority?: boolean;
};

function srcForPole(pole: Props["pole"]): string {
  if (!pole) return PRODAY_MARK;
  if (pole === "pro_club") return PRODAY_MARK_BY_POLE.club;
  if (pole === "pro_staff") return PRODAY_MARK_BY_POLE.coach;
  return PRODAY_MARK_BY_POLE[pole] ?? PRODAY_MARK;
}

/** Symbole officiel ProDay (favicon / nav / admin). */
export function ProdayMark({
  size = 32,
  className = "",
  pole,
  alt = "ProDay",
  priority = false,
}: Props) {
  const src = srcForPole(pole);
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={Math.round(size * (259 / 369))}
      className={`object-contain ${className}`.trim()}
      priority={priority}
    />
  );
}
