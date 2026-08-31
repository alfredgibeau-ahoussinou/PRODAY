"use client";

import {
  AppPhoneShowcase,
  type AppPhoneScreen,
} from "@/components/poles/AppPhoneShowcase";
import { CLUB_APP_SCREENS } from "@/lib/clubAppScreens";

type ClubAppPhoneProps = {
  className?: string;
  screens?: AppPhoneScreen[];
};

/**
 * Cadre iPhone + captures Pôle Club (bleu app, émeraude accent).
 * Chrome partagé via AppPhoneShowcase.
 */
export function ClubAppPhone({
  className = "",
  screens = CLUB_APP_SCREENS,
}: ClubAppPhoneProps) {
  return (
    <AppPhoneShowcase
      className={className}
      screens={screens}
      productLabel="ProDay Club"
      tablistLabel="Écrans de l’app Club"
      glowBackground="radial-gradient(ellipse at 50% 35%, rgba(37, 99, 235, 0.42), transparent 62%), radial-gradient(ellipse at 75% 85%, rgba(16, 185, 129, 0.22), transparent 55%)"
    />
  );
}
