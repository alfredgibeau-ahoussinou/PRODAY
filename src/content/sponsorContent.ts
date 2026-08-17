import type { SponsorOfferType } from '../models/SponsorOffer';

export const SPONSOR_OFFER_TYPES: { id: SponsorOfferType; label: string; icon: string }[] = [
  { id: 'equipment', label: 'Équipement', icon: 'bag' },
  { id: 'visibility', label: 'Visibilité', icon: 'star-four-points' },
  { id: 'money', label: 'Financement', icon: 'briefcase' },
];

import { FOOTBALL_AGE_CATEGORIES } from '../constants/footballCategories';

export const SPONSOR_TARGET_CATEGORIES = [
  ...FOOTBALL_AGE_CATEGORIES.filter((c) =>
    ['U13', 'U15', 'U17', 'U19', 'Seniors', 'Féminines'].includes(c),
  ),
  'U20',
  'Senior',
  'Futsal',
] as const;

export const SPONSOR_MESSAGE_TEMPLATES = [
  {
    id: 'intro',
    label: 'Présentation',
    text: 'Bonjour, nous sommes sponsor ProDay et souhaitons soutenir votre club localement. Pouvons-nous échanger ?',
  },
  {
    id: 'offer',
    label: 'Offre active',
    text: 'Notre offre sponsor est en ligne sur ProDay. Elle couvre équipement et visibilité pour les clubs de votre zone.',
  },
  {
    id: 'funding',
    label: 'Financement',
    text: 'Nous finançons des campagnes clubs sur ProDay. Dites-nous vos besoins matériels ou logistiques pour la saison.',
  },
] as const;

export function getOfferTypeLabel(type: SponsorOfferType): string {
  return SPONSOR_OFFER_TYPES.find((t) => t.id === type)?.label ?? type;
}
