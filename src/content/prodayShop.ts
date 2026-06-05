import type { IconName } from '../components/ui/Icon';
import type { ProductLineId } from '../models/ProductLine';
import { getUniverseIdentity } from './brandExperience';

export type ShopProductCategory = 'equipment' | 'apparel' | 'jersey';

export interface ShopProductSpec {
  label: string;
  value: string;
}

export interface ShopProduct {
  id: string;
  category: ShopProductCategory;
  name: string;
  description: string;
  /** Texte détaillé fiche produit */
  longDescription: string;
  /** Points forts / précisions */
  highlights: string[];
  specs: ShopProductSpec[];
  priceEur: number;
  icon: IconName;
  badge?: string;
}

export interface ShopCopy {
  title: string;
  subtitle: string;
  preorderNote: string;
  contactEmail: string;
}

const CATEGORY_LABELS: Record<ShopProductCategory, string> = {
  equipment: 'Équipement',
  apparel: 'Textile',
  jersey: 'Maillots',
};

export function getShopCategoryLabel(category: ShopProductCategory): string {
  return CATEGORY_LABELS[category];
}

export function getShopCopy(line: ProductLineId): ShopCopy {
  const brand = getUniverseIdentity(line);
  return {
    title: 'ProDay Shop',
    subtitle: `Équipement et textile officiel ${brand.productName} — logo brodé.`,
    preorderNote:
      'Précommande ouverte — livraison estimée sous 3 à 4 semaines. Paiement sécurisé bientôt dans l’app.',
    contactEmail: 'shop@proday.app',
  };
}

export function getShopCatalog(line: ProductLineId): ShopProduct[] {
  const brand = getUniverseIdentity(line);
  const lineTag =
    line === 'woman' ? 'Woman' : line === 'pro' ? 'Pro' : 'Man';

  const apparelSizes = 'XS · S · M · L · XL · XXL';
  const jerseySizes = 'Enfant 10–14 ans · S · M · L · XL';

  return [
    {
      id: 'tripod-pro',
      category: 'equipment',
      name: 'Trépied ProDay',
      description:
        'Trépied smartphone stable pour filmer vos matchs, skills et highlights CV. Sac de transport inclus.',
      longDescription:
        'Conçu pour les joueurs et staff qui veulent des vidéos nettes sans matériel pro. Hauteur réglable, rotation fluide et fixation sécurisée pour iPhone et Android.',
      highlights: [
        'Hauteur 28 à 110 cm',
        'Rotation panoramique 360°',
        'Compatible smartphones 5,5″ à 7″',
        'Sac de transport ProDay inclus',
      ],
      specs: [
        { label: 'Poids', value: '420 g' },
        { label: 'Matériau', value: 'Aluminium + ABS' },
        { label: 'Usage', value: 'CV, skills, matchs' },
        { label: 'Livraison', value: '3–4 semaines' },
      ],
      priceEur: 34.9,
      icon: 'camera',
      badge: 'Best-seller',
    },
    {
      id: 'tripod-flex',
      category: 'equipment',
      name: 'Mini-trépied flexible',
      description: 'Pince universelle + pieds flexibles — idéal touche et banc de touche.',
      longDescription:
        'Le compagnon discret du banc et du vestiaire. Se pose sur une rambarde, s’accroche à un poteau ou se tient en mode mini sur une table.',
      highlights: [
        'Pieds flexibles multi-surfaces',
        'Pince universelle rotative',
        'Format poche',
        'Idéal touche & banc',
      ],
      specs: [
        { label: 'Poids', value: '180 g' },
        { label: 'Hauteur max', value: '28 cm' },
        { label: 'Compatibilité', value: 'Tous smartphones' },
        { label: 'Livraison', value: '3–4 semaines' },
      ],
      priceEur: 19.9,
      icon: 'camera',
    },
    {
      id: 'tee-classic',
      category: 'apparel',
      name: `T-shirt ${brand.productName}`,
      description: `Coton premium, logo ${brand.productName} poitrine. Coupe unisexe.`,
      longDescription: `T-shirt lifestyle ${brand.productName} — à porter au club, en déplacement ou au quotidien. Logo officiel brodé, coupe confortable unisexe.`,
      highlights: [
        `Logo ${brand.productName} brodé`,
        'Coton peigné 180 g/m²',
        'Coupe unisexe droite',
        'Disponible : ' + apparelSizes,
      ],
      specs: [
        { label: 'Matière', value: '100 % coton' },
        { label: 'Entretien', value: 'Lavage 30°' },
        { label: 'Univers', value: brand.productName },
        { label: 'Livraison', value: '3–4 semaines' },
      ],
      priceEur: 29.9,
      icon: 'shirt',
    },
    {
      id: 'tee-training',
      category: 'apparel',
      name: `T-shirt training ${lineTag}`,
      description: 'Dry-fit, respirant — pour l’entraînement et l’échauffement.',
      longDescription:
        'T-shirt technique pour séances, échauffements et footing. Évacue la transpiration et sèche vite — pensé pour l’effort.',
      highlights: [
        'Tissu dry-fit respirant',
        'Zones mesh sous les bras',
        'Logo ProDay réfléchissant',
        'Tailles : ' + apparelSizes,
      ],
      specs: [
        { label: 'Matière', value: 'Polyester recyclé' },
        { label: 'Usage', value: 'Entraînement / match' },
        { label: 'Univers', value: brand.productName },
        { label: 'Livraison', value: '3–4 semaines' },
      ],
      priceEur: 34.9,
      icon: 'shirt',
      badge: 'Nouveau',
    },
    {
      id: 'jersey-home',
      category: 'jersey',
      name: `Maillot domicile ${lineTag}`,
      description: `Maillot match avec logo ProDay et bandeau ${brand.accentLabel}. Personnalisation nom + numéro en option.`,
      longDescription: `Maillot officiel domicile ${lineTag} — tissu match léger, coupe athlétique, finitions ${brand.accentLabel}. Parfait pour tournois, photos CV et équipe.`,
      highlights: [
        `Bandeau ${brand.accentLabel}`,
        'Logo ProDay brodé poitrine',
        'Nom + numéro en option (+8 €)',
        'Tailles : ' + jerseySizes,
      ],
      specs: [
        { label: 'Matière', value: 'Polyester mesh 150 g/m²' },
        { label: 'Personnalisation', value: 'Nom & numéro optionnels' },
        { label: 'Univers', value: brand.productName },
        { label: 'Livraison', value: '4–5 semaines' },
      ],
      priceEur: 59.9,
      icon: 'football',
      badge: 'Officiel',
    },
    {
      id: 'jersey-away',
      category: 'jersey',
      name: `Maillot extérieur ${lineTag}`,
      description: 'Version alternative — même qualité technique, logo brodé.',
      longDescription: `Maillot extérieur ${lineTag} — coloris alternatif, même qualité que le domicile. Idéal déplacements et double match week-end.`,
      highlights: [
        'Coloris extérieur exclusif',
        'Même coupe que le domicile',
        'Logo brodé haute densité',
        'Tailles : ' + jerseySizes,
      ],
      specs: [
        { label: 'Matière', value: 'Polyester mesh 150 g/m²' },
        { label: 'Personnalisation', value: 'Nom & numéro optionnels' },
        { label: 'Univers', value: brand.productName },
        { label: 'Livraison', value: '4–5 semaines' },
      ],
      priceEur: 59.9,
      icon: 'football-outline',
    },
  ];
}

export function formatShopPrice(eur: number): string {
  return `${eur.toFixed(2).replace('.', ',')} €`;
}
