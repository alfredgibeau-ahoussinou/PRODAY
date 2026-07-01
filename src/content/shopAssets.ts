import type { ImageSourcePropType } from 'react-native';
import type { ProductLineId } from '../models/ProductLine';
import { withProFamilyRecord } from '../models/ProductLine';

const SHARED_IMAGES: Record<string, ImageSourcePropType> = {
  'tripod-pro': require('../../assets/shop/shared/tripod-pro.png'),
  'tripod-flex': require('../../assets/shop/shared/tripod-flex.png'),
};

const LINE_IMAGES: Record<ProductLineId, Record<string, ImageSourcePropType>> =
  withProFamilyRecord({
  homme: {
    'tee-classic': require('../../assets/shop/homme/tee-classic.png'),
    'tee-training': require('../../assets/shop/homme/tee-training.png'),
    'jersey-home': require('../../assets/shop/homme/jersey-home.png'),
    'jersey-away': require('../../assets/shop/homme/jersey-away.png'),
  },
  woman: {
    'tee-classic': require('../../assets/shop/woman/tee-classic.png'),
    'tee-training': require('../../assets/shop/woman/tee-training.png'),
    'jersey-home': require('../../assets/shop/woman/jersey-home.png'),
    'jersey-away': require('../../assets/shop/woman/jersey-away.png'),
  },
  amateur: {
    'tee-classic': require('../../assets/shop/homme/tee-classic.png'),
    'tee-training': require('../../assets/shop/homme/tee-training.png'),
    'jersey-home': require('../../assets/shop/homme/jersey-home.png'),
    'jersey-away': require('../../assets/shop/homme/jersey-away.png'),
  },
  supporter: {
    'tee-classic': require('../../assets/shop/homme/tee-classic.png'),
    'tee-training': require('../../assets/shop/homme/tee-training.png'),
    'jersey-home': require('../../assets/shop/homme/jersey-home.png'),
    'jersey-away': require('../../assets/shop/homme/jersey-away.png'),
  },
  pro: {
    'tee-classic': require('../../assets/shop/pro/tee-classic.png'),
    'tee-training': require('../../assets/shop/pro/tee-training.png'),
    'jersey-home': require('../../assets/shop/pro/jersey-home.png'),
    'jersey-away': require('../../assets/shop/pro/jersey-away.png'),
  },
  sante: {
    'tee-classic': require('../../assets/shop/pro/tee-classic.png'),
    'tee-training': require('../../assets/shop/pro/tee-training.png'),
    'jersey-home': require('../../assets/shop/pro/jersey-home.png'),
    'jersey-away': require('../../assets/shop/pro/jersey-away.png'),
  },
});

/** Visuel catalogue pour un produit boutique. */
export function getShopProductImage(
  productId: string,
  line: ProductLineId
): ImageSourcePropType | undefined {
  if (SHARED_IMAGES[productId]) return SHARED_IMAGES[productId];
  return LINE_IMAGES[line]?.[productId];
}
