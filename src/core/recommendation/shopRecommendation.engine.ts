import type { ShopProduct } from '../../content/prodayShop';
import type { User } from '../../models/User';
import type { ProductLineId } from '../../models/ProductLine';
import type { HealthState } from '../types/health';
import { rankScore } from './recommendation.engine';

export interface ShopProductRecommendation {
  productId: string;
  iaScore: number;
  reason: string;
}

const HEALTH_KEYWORDS = ['bande', 'cheville', 'prévention', 'soin', 'rééduc', 'protection'];
const POSITION_HINTS: Record<string, string[]> = {
  gardien: ['gant', 'protection'],
  défenseur: ['chaussure', 'maillot'],
  milieu: ['chaussure', 'textile'],
  attaquant: ['chaussure', 'vitesse'],
};

function textBlob(product: ShopProduct): string {
  return [product.name, product.description, ...product.highlights, product.category]
    .join(' ')
    .toLowerCase();
}

/** Ranking produits — poste, univers, santé (spec §6). */
export function buildShopProductRecommendations(params: {
  profile: User | null;
  products: ShopProduct[];
  healthState: HealthState;
  productLine: ProductLineId;
}): ShopProductRecommendation[] {
  const position = params.profile?.profile.position?.toLowerCase();
  const hints = position
    ? Object.entries(POSITION_HINTS).find(([k]) => position.includes(k))?.[1] ?? []
    : [];

  const healthBoost =
    params.healthState === 'INJURY_RISK' ||
    params.healthState === 'OVERLOADED' ||
    params.healthState === 'FATIGUED';

  return params.products
    .map((product) => {
      const blob = textBlob(product);
      let raw = 0.35;

      if (hints.some((h) => blob.includes(h))) raw += 0.25;
      if (healthBoost && HEALTH_KEYWORDS.some((k) => blob.includes(k))) raw += 0.22;
      if (product.category === 'equipment' && healthBoost) raw += 0.08;
      if (product.badge) raw += 0.1;
      if (params.productLine === 'sante' && product.category === 'equipment') raw += 0.12;

      const iaScore = rankScore(raw);
      let reason = 'Sélection ProDay';
      if (healthBoost && HEALTH_KEYWORDS.some((k) => blob.includes(k))) {
        reason = 'Adapté récupération';
      } else if (hints.some((h) => blob.includes(h))) {
        reason = 'Pour votre poste';
      } else if (product.badge) {
        reason = 'Coup de cœur';
      }

      return { productId: product.id, iaScore, reason };
    })
    .sort((a, b) => b.iaScore - a.iaScore);
}

export function shopScoreMap(
  recs: ShopProductRecommendation[]
): Map<string, ShopProductRecommendation> {
  return new Map(recs.map((r) => [r.productId, r]));
}

export function sortShopProductsByFit(
  products: ShopProduct[],
  recs: ShopProductRecommendation[],
  enabled: boolean
): ShopProduct[] {
  if (!enabled || recs.length === 0) return products;
  const order = new Map(recs.map((r, i) => [r.productId, i]));
  return [...products].sort(
    (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999)
  );
}
