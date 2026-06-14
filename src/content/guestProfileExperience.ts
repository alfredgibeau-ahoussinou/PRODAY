import type { IconName } from '../components/ui/Icon';
import type { ProductLineId } from '../models/ProductLine';

export type GuestUnlockItem = {
  step: string;
  title: string;
  body: string;
  icon: IconName;
};

const PLAYER_UNLOCK: GuestUnlockItem[] = [
  {
    step: '01',
    title: 'Fiche & identité',
    body: 'Photo, poste, ville et niveau — votre carte de visite sportive.',
    icon: 'person',
  },
  {
    step: '02',
    title: 'CV & candidatures',
    body: 'Vitrine en ligne, stats et suivi Mercato sans PDF.',
    icon: 'document',
  },
  {
    step: '03',
    title: 'Messages & matchs',
    body: 'Convocations, échanges clubs et organisation des matchs.',
    icon: 'chat',
  },
];

const PRO_UNLOCK: GuestUnlockItem[] = [
  {
    step: '01',
    title: 'Profil staff',
    body: 'Club, zone d’intervention et mandat — visible par les joueurs.',
    icon: 'school',
  },
  {
    step: '02',
    title: 'Matchs & mercato',
    body: 'Convocations, annonces recrutement et suivi des candidatures.',
    icon: 'handshake',
  },
  {
    step: '03',
    title: 'Vérification pro',
    body: 'Justificatifs analysés par IA avant activation complète.',
    icon: 'shield',
  },
];

const SANTE_UNLOCK: GuestUnlockItem[] = [
  {
    step: '01',
    title: 'Cabinet & diplômes',
    body: 'Spécialité, zone d’intervention et visibilité auprès des clubs.',
    icon: 'heart',
  },
  {
    step: '02',
    title: 'Agenda praticien',
    body: 'Créneaux, rendez-vous sportifs et suivi des patients.',
    icon: 'calendar',
  },
  {
    step: '03',
    title: 'Messagerie sécurisée',
    body: 'Échanges avec joueurs et staff — dossier médical confidentiel.',
    icon: 'chat',
  },
];

export function getGuestProfileUnlockItems(line: ProductLineId): GuestUnlockItem[] {
  switch (line) {
    case 'pro':
      return PRO_UNLOCK;
    case 'sante':
      return SANTE_UNLOCK;
    default:
      return PLAYER_UNLOCK;
  }
}

export function getGuestProfileHeroCopy(line: ProductLineId, brandName: string): string {
  switch (line) {
    case 'pro':
      return `Votre espace staff ${brandName} — profil, matchs, mercato et vérification.`;
    case 'sante':
      return `Votre espace praticien ${brandName} — cabinet, agenda et messagerie patients.`;
    default:
      return `Votre espace personnel ${brandName} — fiche, CV, paramètres et abonnement.`;
  }
}
