/**
 * Helpers purs hub Club (identité) — localisation, pack, tuiles réglages (testables).
 */
import {
  CLUB_LIVE_PACKS,
  isClubLivePackId,
  type ClubLivePackId,
} from '../../../content/clubLivePacks';
import type { IconName } from '../../../components/ui/iconNames';
import type { ClubNavItemId } from '../navigation/clubNavConfig';

export type ClubHubBrandSource = 'stored' | 'logo' | 'palette' | string | undefined;

export type ClubHubSettingsTileId =
  | 'pack'
  | 'permissions'
  | 'notifications'
  | 'licenses'
  | 'finances'
  | 'sponsoring'
  | 'equipment'
  | 'automations'
  | 'president';

export type ClubHubSettingsTile = {
  id: ClubHubSettingsTileId;
  label: string;
  hint: string;
  icon: IconName;
  nav?: ClubNavItemId;
  /** Ouvre le pôle Président (pas une nav Club). */
  president?: boolean;
  primary?: boolean;
};

export type ClubHubAlert = {
  id: 'without_coach' | 'pending_memberships';
  title: string;
  body: string;
  ctaLabel: string;
  nav: ClubNavItemId;
  tone: 'warn' | 'alert' | 'ok';
};

export function formatClubHubLocation(
  city?: string | null,
  department?: string | null,
): string {
  const parts = [city?.trim(), department?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : '';
}

export function resolveClubHubBrandSourceLabel(source: ClubHubBrandSource): string {
  if (source === 'stored') return 'Couleurs enregistrées';
  if (source === 'logo') return 'Issues du logo';
  return 'Palette ProDay';
}

export function resolveClubHubPackLabel(offerId?: string | null): {
  title: string;
  hint: string;
} {
  if (offerId && isClubLivePackId(offerId)) {
    const pack = CLUB_LIVE_PACKS[offerId as ClubLivePackId];
    return {
      title: pack.shortLabel,
      hint: `${pack.hint} · SUR DEVIS`,
    };
  }
  return {
    title: 'SUR DEVIS',
    hint: 'À partir de 3 € par adhérent — jamais « Premium »',
  };
}

export function resolveClubHubSubtitle(input: {
  city?: string | null;
  department?: string | null;
  verified?: boolean;
}): string {
  const loc = formatClubHubLocation(input.city, input.department);
  const verif = input.verified ? 'Club vérifié' : 'Vérification en cours';
  if (loc) return `${loc} · ${verif}`;
  return `Identité & réglages · ${verif}`;
}

export function formatClubHubMetaLine(input: {
  players: number;
  coaches: number;
  teams: number;
}): string {
  return [
    `${input.players} joueur${input.players > 1 ? 's' : ''}`,
    `${input.coaches} coach${input.coaches > 1 ? 's' : ''}`,
    `${input.teams} équipe${input.teams > 1 ? 's' : ''}`,
  ].join(' · ');
}

export function buildClubHubAlerts(input: {
  teamsWithoutCoach: number;
  pendingMemberships: number;
}): ClubHubAlert[] {
  const out: ClubHubAlert[] = [];
  if (input.teamsWithoutCoach > 0) {
    out.push({
      id: 'without_coach',
      title:
        input.teamsWithoutCoach === 1
          ? '1 équipe sans coach'
          : `${input.teamsWithoutCoach} équipes sans coach`,
      body: 'Affectez un coach depuis l’annuaire staff.',
      ctaLabel: 'Coachs',
      nav: 'coaches',
      tone: 'warn',
    });
  }
  if (input.pendingMemberships > 0) {
    out.push({
      id: 'pending_memberships',
      title:
        input.pendingMemberships === 1
          ? '1 adhésion en attente'
          : `${input.pendingMemberships} adhésions en attente`,
      body: 'Validez les joueurs depuis l’effectif.',
      ctaLabel: 'Joueurs',
      nav: 'players',
      tone: 'alert',
    });
  }
  return out;
}

export function buildClubHubSettingsTiles(input: {
  hasPresident: boolean;
  packHint: string;
}): ClubHubSettingsTile[] {
  const tiles: ClubHubSettingsTile[] = [
    {
      id: 'pack',
      label: 'Pack Club',
      hint: input.packHint,
      icon: 'star-outline',
      nav: 'pack',
      primary: true,
    },
    {
      id: 'permissions',
      label: 'Permissions & rôles',
      hint: 'Accès staff et droits',
      icon: 'shield',
      nav: 'permissions',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      hint: 'Alertes club et rappels',
      icon: 'notifications',
      nav: 'notifications',
    },
    {
      id: 'licenses',
      label: 'Licences & documents',
      hint: 'Pièces et dossiers',
      icon: 'document',
      nav: 'licenses',
    },
    {
      id: 'finances',
      label: 'Finances',
      hint: 'Ledger et mouvements',
      icon: 'bag',
      nav: 'finances',
    },
    {
      id: 'sponsoring',
      label: 'Sponsoring',
      hint: 'Partenaires et offres',
      icon: 'gift',
      nav: 'sponsoring',
    },
    {
      id: 'equipment',
      label: 'Bourse équipements',
      hint: 'Matériel et échanges',
      icon: 'shirt',
      nav: 'equipment',
    },
    {
      id: 'automations',
      label: 'Automatisations',
      hint: 'Règles et rappels',
      icon: 'tune',
      nav: 'automations',
    },
  ];
  if (input.hasPresident) {
    tiles.push({
      id: 'president',
      label: 'Pôle Président',
      hint: 'Gouvernance et cockpit',
      icon: 'briefcase',
      president: true,
    });
  }
  return tiles;
}
