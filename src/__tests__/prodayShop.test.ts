import { getShopCatalog, getShopCopy, formatShopPrice } from '../content/prodayShop';
import { getShopProductImage } from '../content/shopAssets';

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
    expect(getShopCopy('woman').title).toBe('ProDay Shop');
    expect(getShopCopy('pro').subtitle).toMatch(/Pro Day Pro/);
  });

  it('associe une image à chaque produit', () => {
    for (const line of ['homme', 'woman', 'pro'] as const) {
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
});
