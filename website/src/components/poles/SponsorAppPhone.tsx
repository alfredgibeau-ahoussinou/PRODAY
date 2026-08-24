"use client";

import {
  AppPhoneShowcase,
  type AppPhoneScreen,
} from "@/components/poles/AppPhoneShowcase";
import { SPONSOR_APP_SCREENS } from "@/lib/sponsorAppScreens";

type SponsorAppPhoneProps = {
  className?: string;
  screens?: AppPhoneScreen[];
};

/**
 * Cadre iPhone + captures Pôle Sponsor (magenta / violet app).
 * Chrome partagé via AppPhoneShowcase.
 */
export function SponsorAppPhone({
  className = "",
  screens = SPONSOR_APP_SCREENS,
}: SponsorAppPhoneProps) {
  return (
    <AppPhoneShowcase
      className={className}
      screens={screens}
      productLabel="ProDay Sponsor"
      tablistLabel="Écrans de l’app Sponsor"
      glowBackground="radial-gradient(ellipse at 50% 35%, rgba(192, 38, 211, 0.45), transparent 62%), radial-gradient(ellipse at 75% 85%, rgba(232, 121, 249, 0.22), transparent 55%)"
    />
  );
}
