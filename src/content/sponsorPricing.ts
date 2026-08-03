import { yearlyPriceFromMonthly } from '../utils/subscriptionPricing';

export type SponsorPricingTierId = 'starter' | 'territorial' | 'national';

export interface SponsorPricingTier {
  id: SponsorPricingTierId;
  name: string;
  tagline: string;
  monthlyEur: number;
  yearlyEur: number;
  highlighted?: boolean;
  badge?: string;
  features: string[];
  /** Tier lié à l'abonnement in-app (national → sponsor_pro). */
  subscriptionTier?: 'free' | 'pro';
  ctaLabel: string;
}

export const SPONSOR_PRICING_INTRO = {
  title: 'Espace Sponsors ProDay',
  subtitle:
    'Sponsor et partenaire : même profil sur ProDay. Touchez clubs, joueurs et organisateurs sur votre territoire. Visibilité mesurable, sans intermédiaire.',
  footnote:
    'Tarifs HT · facturation mensuelle ou annuelle (−20 %) · résiliation à tout moment sur les formules en ligne.',
};

export const SPONSOR_PRICING_TIERS: SponsorPricingTier[] = [
  {
    id: 'starter',
    name: 'Découverte',
    tagline: 'Tester la visibilité locale',
    monthlyEur: 0,
    yearlyEur: 0,
    subscriptionTier: 'free',
    ctaLabel: 'Créer un compte gratuit',
    features: [
      'Profil sponsor vérifié',
      '1 offre active dans l’annuaire',
      'Zone géographique (ville)',
      '10 messages clubs / mois',
      'Statistiques de base',
    ],
  },
  {
    id: 'territorial',
    name: 'Territorial',
    tagline: 'Rayonner sur un département',
    monthlyEur: 49,
    yearlyEur: yearlyPriceFromMonthly(49),
    ctaLabel: 'Demande commerciale',
    features: [
      'Jusqu’à 5 offres actives',
      'Ciblage par département',
      'Prospects clubs recommandés',
      'Messagerie clubs illimitée',
      'Financement campagnes clubs',
      'Statistiques mensuelles détaillées',
    ],
  },
  {
    id: 'national',
    name: 'National Pro',
    tagline: 'Visibilité maximale sur ProDay',
    monthlyEur: 99,
    yearlyEur: yearlyPriceFromMonthly(99),
    highlighted: true,
    badge: 'Recommandé',
    subscriptionTier: 'pro',
    ctaLabel: 'Passer National Pro',
    features: [
      'Offres illimitées',
      'Logo mis en avant (onglet Sponsors)',
      'Campagnes locales ciblées',
      "Push géolocalisé local (bêta, sur opt-in)",
      'Account manager email',
      'Priorité support sponsors',
    ],
  },
];

export const SPONSOR_VALUE_PILLARS = [
  {
    icon: 'people' as const,
    title: 'Clubs qualifiés',
    body: 'Accédez aux structures actives sur ProDay : convocations, Mercato, financement.',
  },
  {
    icon: 'star-four-points' as const,
    title: 'Visibilité mesurée',
    body: 'Impressions, clics et leads suivis depuis votre tableau de bord sponsor.',
  },
  {
    icon: 'briefcase' as const,
    title: 'Offres & financement',
    body: 'Publiez équipement, visibilité ou soutien financier aux campagnes clubs.',
  },
];

/** Contact commercial sponsors (unique adresse publique). */
export const SPONSOR_CONTACT_EMAIL = 'proday.admin@gmail.com';
/** @deprecated Utiliser SPONSOR_CONTACT_EMAIL */
export const SPONSOR_PARTNER_CONTACT_EMAIL = SPONSOR_CONTACT_EMAIL;
