"use client";

import {
  AppPhoneShowcase,
  type AppPhoneScreen,
} from "@/components/poles/AppPhoneShowcase";
import { PARENT_APP_SCREENS } from "@/lib/parentAppScreens";

type ParentAppPhoneProps = {
  className?: string;
  screens?: AppPhoneScreen[];
};

/**
 * Cadre iPhone + captures Pôle Parent (orange app, lime nav).
 * Chrome partagé via AppPhoneShowcase.
 */
export function ParentAppPhone({
  className = "",
  screens = PARENT_APP_SCREENS,
}: ParentAppPhoneProps) {
  return (
    <AppPhoneShowcase
      className={className}
      screens={screens}
      productLabel="ProDay Parent"
      tablistLabel="Écrans de l’app Parent"
      glowBackground="radial-gradient(ellipse at 50% 35%, rgba(249, 115, 22, 0.42), transparent 62%), radial-gradient(ellipse at 75% 85%, rgba(132, 204, 22, 0.22), transparent 55%)"
    />
  );
}
