"use client";

import {
  AppPhoneShowcase,
  type AppPhoneScreen,
} from "@/components/poles/AppPhoneShowcase";
import { COACH_APP_SCREENS } from "@/lib/coachAppScreens";

type CoachAppPhoneProps = {
  className?: string;
  screens?: AppPhoneScreen[];
};

/**
 * Cadre iPhone + captures Pôle Coach (bleu app, FAB or).
 * Chrome partagé via AppPhoneShowcase.
 */
export function CoachAppPhone({
  className = "",
  screens = COACH_APP_SCREENS,
}: CoachAppPhoneProps) {
  return (
    <AppPhoneShowcase
      className={className}
      screens={screens}
      productLabel="ProDay Coach"
      tablistLabel="Écrans de l’app Coach"
      glowBackground="radial-gradient(ellipse at 50% 35%, rgba(37, 99, 235, 0.45), transparent 62%), radial-gradient(ellipse at 75% 85%, rgba(232, 185, 35, 0.18), transparent 55%)"
    />
  );
}
