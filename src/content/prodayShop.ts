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
  /** Tailles disponibles (textile / maillot). */
  sizes?: string[];
}

export type ShopSortId = 'featured' | 'price-asc' | 'price-desc' | 'name';

export interface ShopHeroStats {
  productCount: number;
  categoryCount: number;
  fromPriceEur: number;
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

export type ShopCategoryDef = {
  id: ShopProductCategory;
  label: string;
  icon: IconName;
};

const SHOP_CATEGORIES_FOOT: ShopCategoryDef[] = [
  { id: 'equipment', label: 'Équipement', icon: 'camera' },
  { id: 'apparel', label: 'Textile', icon: 'shirt' },
  { id: 'jersey', label: 'Maillots', icon: 'football' },
];

const SHOP_CATEGORIES_SANTE: ShopCategoryDef[] = [
  { id: 'equipment', label: 'Matériel', icon: 'camera' },
  { id: 'apparel', label: 'Textile pro', icon: 'shirt' },
  { id: 'jersey', label: 'Tenues cabinet', icon: 'heart' },
];

const SHOP_CATEGORIES_SUPPORTER: ShopCategoryDef[] = [
  { id: 'apparel', label: 'Collection fan', icon: 'shirt' },
  { id: 'jersey', label: 'Maillots tribune', icon: 'football' },
];

export function getShopCategories(line: ProductLineId): ShopCategoryDef[] {
  if (line === 'sante') return SHOP_CATEGORIES_SANTE;
  if (line === 'supporter') return SHOP_CATEGORIES_SUPPORTER;
  return SHOP_CATEGORIES_FOOT;
}

export function getShopCategoryLabel(category: ShopProductCategory, line?: ProductLineId): string {
  if (line) {
    const match = getShopCategories(line).find((c) => c.id === category);
    if (match) return match.label;
  }
  return CATEGORY_LABELS[category];
}

export const SHOP_TRUST_ITEMS = [
  { icon: 'shield' as const, title: 'Logo brodé', body: 'Qualité officielle ProDay' },
  { icon: 'time' as const, title: '3 à 4 semaines', body: 'Livraison France' },
  { icon: 'bag' as const, title: 'Précommande', body: 'Carte ou email' },
] as const;

export function getShopSpotlight(catalog: ShopProduct[]): ShopProduct | null {
  const tagged = catalog.find((p) => p.badge);
  return tagged ?? catalog[0] ?? null;
}

export function getShopCopy(line: ProductLineId): ShopCopy {
  const brand = getUniverseIdentity(line);
  const subtitle =
    line === 'sante'
      ? `Textile et matériel ${brand.productName} pour votre cabinet.`
      : line === 'supporter'
        ? 'Textile et maillots Pro Day Supporter. Soutenez votre tribune.'
        : `Équipement et textile ${brand.productName}. Collection officielle.`;
  return {
    title: line === 'supporter' ? 'Boutique Supporter' : 'ProDay Store',
    subtitle,
    preorderNote:
      'Précommande ouverte. Livraison estimée sous 3 à 4 semaines. Paiement sécurisé par carte dans l’app.',
    contactEmail: 'proday.admin@gmail.com',
  };
}

function shopLineTag(line: ProductLineId): string {
  if (line === 'woman') return 'Woman';
  if (line === 'pro' || line === 'pro_player' || line === 'pro_club' || line === 'pro_staff') {
    return 'Pro';
  }
  if (line === 'sante') return 'Santé';
  if (line === 'supporter') return 'Supporter';
  if (line === 'sponsor') return 'Sponsor';
  if (line === 'amateur' || line === 'homme') return 'Amateur';
  return 'Amateur';
}

function adaptCatalogForLine(line: ProductLineId, catalog: ShopProduct[]): ShopProduct[] {
  if (line === 'supporter') {
    return catalog
      .filter((product) => product.category !== 'equipment')
      .map((product) => {
        if (product.id === 'tee-training') {
          return {
            ...product,
            name: 'T-shirt tribune Supporter',
            description: 'Dry-fit violet Pro Day. Pour les soirs de match et les tournois suivis.',
            longDescription:
              'T-shirt technique aux couleurs Supporter pour afficher vos couleurs en tribune, au club ou devant l’écran.',
          };
        }
        if (product.id === 'jersey-home') {
          return {
            ...product,
            description: 'Maillot domicile Pro Day Supporter. Personnalisation nom en option.',
          };
        }
        return product;
      });
  }
  if (line !== 'sante') return catalog;
  const brand = getUniverseIdentity(line);
  return catalog.map((product) => {
    switch (product.id) {
      case 'tripod-pro':
        return {
          ...product,
          description:
            'Trépied stable pour filmer des exercices, bilans ou visios patients. Sac de transport inclus.',
          longDescription:
            'Pensé pour les praticiens qui documentent des séances ou des bilans vidéo. Hauteur réglable, fixation sécurisée smartphone et format transportable entre cabinet et terrain.',
          highlights: [
            'Hauteur 28 à 110 cm',
            'Idéal exercices & bilans vidéo',
            'Compatible smartphones 5,5″ à 7″',
            'Sac de transport ProDay inclus',
          ],
          specs: [
            { label: 'Poids', value: '420 g' },
            { label: 'Usage', value: 'Cabinet · terrain' },
            { label: 'Univers', value: brand.productName },
            { label: 'Livraison', value: '3 à 4 semaines' },
          ],
        };
      case 'tripod-flex':
        return {
          ...product,
          description: 'Mini support flexible. Banc, table de soin ou vestiaire club.',
          longDescription:
            'Format discret pour filmer une séance en salle ou sur le bord du terrain. Se pose sur une table, une rambarde ou un dossier de chaise.',
        };
      case 'tee-training':
        return {
          ...product,
          name: 'Polo technique cabinet',
          description: 'Dry-fit, respirant. Pour les consultations et déplacements club.',
          longDescription:
            'Polo technique pour l’activité quotidienne du praticien : consultations, déplacements club et interventions terrain.',
        };
      case 'jersey-home':
        return {
          ...product,
          name: 'Polo cabinet Santé',
          description: `Polo professionnel ${brand.productName}. Logo brodé, coupe soignée.`,
          longDescription: `Polo cabinet officiel ${brand.productName}. Tissu confortable, finitions soignées et logo brodé pour votre pratique au club ou en cabinet.`,
          highlights: [
            `Logo ${brand.productName} brodé`,
            'Coupe professionnelle',
            'Confort journée complète',
            'Tailles : XS · S · M · L · XL · XXL',
          ],
          icon: 'heart',
          badge: 'Officiel',
        };
      case 'jersey-away':
        return {
          ...product,
          name: 'Veste softshell cabinet',
          description: 'Veste légère. Déplacements club, matchs et interventions extérieures.',
          longDescription:
            'Veste softshell coupe-vent pour les praticiens en déplacement : matchs, stages et interventions sur le terrain.',
          icon: 'heart',
        };
      default:
        return product;
    }
  });
}

export function getShopCatalog(line: ProductLineId): ShopProduct[] {
  const brand = getUniverseIdentity(line);
  const lineTag = shopLineTag(line);

  const apparelSizes = 'XS · S · M · L · XL · XXL';
  const jerseySizes = 'Enfant 10 à 14 ans · S · M · L · XL';

  const catalog: ShopProduct[] = [
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
        { label: 'Livraison', value: '3 à 4 semaines' },
      ],
      priceEur: 34.9,
      icon: 'camera',
      badge: 'Best-seller',
      sizes: undefined,
    },
    {
      id: 'tripod-flex',
      category: 'equipment',
      name: 'Mini-trépied flexible',
      description: 'Pince universelle + pieds flexibles. Idéal touche et banc de touche.',
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
        { label: 'Livraison', value: '3 à 4 semaines' },
      ],
      priceEur: 19.9,
      icon: 'camera',
    },
    {
      id: 'tee-classic',
      category: 'apparel',
      name: `T-shirt ${brand.productName}`,
      description: `Coton premium, logo ${brand.productName} poitrine. Coupe unisexe.`,
      longDescription: `T-shirt lifestyle ${brand.productName}. À porter au club, en déplacement ou au quotidien. Logo officiel brodé, coupe confortable unisexe.`,
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
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
        { label: 'Livraison', value: '3 à 4 semaines' },
      ],
      priceEur: 29.9,
      icon: 'shirt',
    },
    {
      id: 'tee-training',
      category: 'apparel',
      name: `T-shirt training ${lineTag}`,
      description: 'Dry-fit, respirant. Pour l’entraînement et l’échauffement.',
      longDescription:
        'T-shirt technique pour séances, échauffements et footing. Évacue la transpiration et sèche vite. Pensé pour l’effort.',
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
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
        { label: 'Livraison', value: '3 à 4 semaines' },
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
      longDescription: `Maillot officiel domicile ${lineTag}. Tissu match léger, coupe athlétique, finitions ${brand.accentLabel}. Parfait pour tournois, photos CV et équipe.`,
      sizes: ['10-14', 'S', 'M', 'L', 'XL'],
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
        { label: 'Livraison', value: '4 à 5 semaines' },
      ],
      priceEur: 59.9,
      icon: 'football',
      badge: 'Officiel',
    },
    {
      id: 'jersey-away',
      category: 'jersey',
      name: `Maillot extérieur ${lineTag}`,
      description: 'Version alternative. Même qualité technique, logo brodé.',
      longDescription: `Maillot extérieur ${lineTag}. Coloris alternatif, même qualité que le domicile. Idéal déplacements et double match week-end.`,
      sizes: ['10-14', 'S', 'M', 'L', 'XL'],
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
        { label: 'Livraison', value: '4 à 5 semaines' },
      ],
      priceEur: 59.9,
      icon: 'football-outline',
    },
  ];

  return adaptCatalogForLine(line, catalog);
}

export function formatShopPrice(eur: number): string {
  return `${eur.toFixed(2).replace('.', ',')} €`;
}

export function getShopHeroStats(catalog: ShopProduct[]): ShopHeroStats {
  const categories = new Set(catalog.map((p) => p.category));
  const fromPriceEur = catalog.reduce(
    (min, p) => Math.min(min, p.priceEur),
    catalog[0]?.priceEur ?? 0
  );
  return {
    productCount: catalog.length,
    categoryCount: categories.size,
    fromPriceEur,
  };
}

export function sortShopProducts(
  products: ShopProduct[],
  sort: ShopSortId
): ShopProduct[] {
  const copy = [...products];
  switch (sort) {
    case 'price-asc':
      return copy.sort((a, b) => a.priceEur - b.priceEur);
    case 'price-desc':
      return copy.sort((a, b) => b.priceEur - a.priceEur);
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    default:
      return copy;
  }
}

export function getRelatedProducts(
  catalog: ShopProduct[],
  productId: string,
  limit = 3
): ShopProduct[] {
  const current = catalog.find((p) => p.id === productId);
  if (!current) return catalog.filter((p) => p.id !== productId).slice(0, limit);
  return catalog
    .filter((p) => p.id !== productId)
    .sort((a, b) => {
      const aScore = a.category === current.category ? 0 : 1;
      const bScore = b.category === current.category ? 0 : 1;
      return aScore - bScore || a.priceEur - b.priceEur;
    })
    .slice(0, limit);
}

export const SHOP_DELIVERY_STEPS = [
  { title: 'Précommande', body: 'Vous recevez un email de confirmation sous 24 h.' },
  { title: 'Production', body: 'Fabrication et broderie logo. 2 à 3 semaines.' },
  { title: 'Expédition', body: 'Livraison suivie en France métropolitaine.' },
] as const;

export const SHOP_FAQ = [
  {
    q: 'Paiement dans l’app ?',
    a: 'Oui. Ajoutez au panier puis payez par carte (Stripe). La précommande par email reste disponible.',
  },
  {
    q: 'Échanges & retours',
    a: '14 jours après réception pour les articles non personnalisés.',
  },
  {
    q: 'Personnalisation maillot',
    a: 'Nom et numéro en option (+8 €). Indiquez-les dans votre email de précommande.',
  },
] as const;
