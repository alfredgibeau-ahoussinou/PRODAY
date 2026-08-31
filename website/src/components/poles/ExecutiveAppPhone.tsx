"use client";

import {
  AppPhoneShowcase,
  type AppPhoneScreen,
} from "@/components/poles/AppPhoneShowcase";
import { EXECUTIVE_APP_SCREENS } from "@/lib/executiveAppScreens";

type ExecutiveAppPhoneProps = {
  className?: string;
  /** Écrans à afficher (défaut : tous les écrans Président). */
  screens?: AppPhoneScreen[];
};

/**
 * Cadre iPhone + captures Executive (Président).
 * Chrome partagé via AppPhoneShowcase.
 */
export function ExecutiveAppPhone({
  className = "",
  screens = EXECUTIVE_APP_SCREENS,
}: ExecutiveAppPhoneProps) {
  return (
    <AppPhoneShowcase
      className={className}
      screens={screens}
      productLabel="ProDay Président"
      tablistLabel="Écrans de l’app Président"
      glowBackground="radial-gradient(ellipse at 50% 40%, rgba(124, 58, 237, 0.35), transparent 65%)"
    />
  );
}
