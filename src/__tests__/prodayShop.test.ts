import {
  getShopCatalog,
  getShopCategories,
  getShopCopy,
  getShopCategoryLabel,
  formatShopPrice,
  getShopHeroStats,
  getRelatedProducts,
  sortShopProducts,
} from '../content/prodayShop';
import { getShopProductImage } from '../content/shopAssets';
import { SHOP_STRIPE_PRODUCTS } from '../../functions/src/shopStripeCatalog';

describe('prodayShop', () => {
  it('adapte le catalogue par univers', () => {
    const man = getShopCatalog('homme');
    const woman = getShopCatalog('woman');
    const pro = getShopCatalog('pro');

    expect(man.find((p) => p.id === 'jersey-home')?.name).toMatch(/Man/);
    expect(woman.find((p) => p.id === 'jersey-home')?.name).toMatch(/Woman/);
    expect(pro.find((p) => p.id === 'jersey-home')?.name).toMatch(/Pro/);
    expect(man.some((p) => p.id === 'tripod-pro')).toBe(true);
  });

  it('formate les prix en euros', () => {
    expect(formatShopPrice(29.9)).toBe('29,90 €');
  });

  it('expose une copie boutique par ligne', () => {
    expect(getShopCopy('woman').title).toBe('ProDay Store');
    expect(getShopCopy('pro').subtitle).toMatch(/Pro Day Pro/);
    expect(getShopCopy('sante').subtitle).toMatch(/cabinet/);
  });

  it('adapte les libellés de catégories par univers', () => {
    expect(getShopCategoryLabel('jersey', 'homme')).toBe('Maillots');
    expect(getShopCategoryLabel('jersey', 'sante')).toBe('Tenues cabinet');
    expect(getShopCategories('sante').map((c) => c.label)).toEqual([
      'Matériel',
      'Textile pro',
      'Tenues cabinet',
    ]);
  });

  it('personnalise le catalogue Santé', () => {
    const sante = getShopCatalog('sante');
    expect(sante.find((p) => p.id === 'jersey-home')?.name).toMatch(/Polo cabinet/);
    expect(sante.find((p) => p.id === 'tee-classic')?.name).toMatch(/Pro Day Santé/);
  });

  it('associe une image à chaque produit', () => {
    for (const line of ['homme', 'woman', 'pro', 'sante'] as const) {
      for (const product of getShopCatalog(line)) {
        expect(getShopProductImage(product.id, line)).toBeDefined();
      }
    }
  });

  it('expose une fiche détaillée par produit', () => {
    const product = getShopCatalog('homme')[0];
    expect(product.longDescription.length).toBeGreaterThan(20);
    expect(product.highlights.length).toBeGreaterThanOrEqual(3);
    expect(product.specs.length).toBeGreaterThanOrEqual(3);
  });

  it('calcule les stats hero boutique', () => {
    const catalog = getShopCatalog('homme');
    const stats = getShopHeroStats(catalog);
    expect(stats.productCount).toBe(catalog.length);
    expect(stats.categoryCount).toBe(3);
    expect(stats.fromPriceEur).toBeGreaterThan(0);
  });

  it('aligne les prix Stripe avec le catalogue app', () => {
    const catalog = getShopCatalog('homme');
    for (const product of catalog) {
      const stripe = SHOP_STRIPE_PRODUCTS[product.id];
      expect(stripe).toBeDefined();
      expect(stripe.priceCents).toBe(Math.round(product.priceEur * 100));
    }
    expect(Object.keys(SHOP_STRIPE_PRODUCTS)).toHaveLength(catalog.length);
  });

  it('trie et propose des produits associés', () => {
    const catalog = getShopCatalog('woman');
    const sorted = sortShopProducts(catalog, 'price-asc');
    expect(sorted[0].priceEur).toBeLessThanOrEqual(sorted[sorted.length - 1].priceEur);
    const related = getRelatedProducts(catalog, 'tee-classic', 2);
    expect(related).toHaveLength(2);
    expect(related.every((p) => p.id !== 'tee-classic')).toBe(true);
  });
});
