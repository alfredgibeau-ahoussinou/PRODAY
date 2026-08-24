"use client";

import {
  AppPhoneShowcase,
  type AppPhoneScreen,
} from "@/components/poles/AppPhoneShowcase";
import { PLAYER_APP_SCREENS } from "@/lib/playerAppScreens";

type PlayerAppPhoneProps = {
  className?: string;
  screens?: AppPhoneScreen[];
};

/**
 * Cadre iPhone + captures Pôle Joueur (bleu / rouge).
 */
export function PlayerAppPhone({
  className = "",
  screens = PLAYER_APP_SCREENS,
}: PlayerAppPhoneProps) {
  return (
    <AppPhoneShowcase
      className={className}
      screens={screens}
      productLabel="ProDay Joueur"
      tablistLabel="Écrans de l’app Joueur"
      glowBackground="radial-gradient(ellipse at 50% 35%, rgba(30, 58, 255, 0.45), transparent 62%), radial-gradient(ellipse at 70% 80%, rgba(239, 68, 68, 0.22), transparent 55%)"
    />
  );
}
