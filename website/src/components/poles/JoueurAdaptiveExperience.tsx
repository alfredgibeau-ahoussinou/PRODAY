"use client";

import type { JoueurExperienceTheme } from "@/lib/joueurExperienceTheme";
import { AdultUniverse } from "@/components/poles/joueurWorld/AdultUniverse";
import { TeenUniverse } from "@/components/poles/joueurWorld/TeenUniverse";
import { YouthUniverse } from "@/components/poles/joueurWorld/YouthUniverse";

type Props = {
  theme: JoueurExperienceTheme;
};

/**
 * Routeur d’univers : 3 UX réellement distinctes (jeune / ado / adulte),
 * hors style Terminal du site marketing.
 */
export function JoueurAdaptiveExperience({ theme }: Props) {
  if (theme.ageGroup === "youth") return <YouthUniverse theme={theme} />;
  if (theme.ageGroup === "teen") return <TeenUniverse theme={theme} />;
  return <AdultUniverse theme={theme} />;
}
