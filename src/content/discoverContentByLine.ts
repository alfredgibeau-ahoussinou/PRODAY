import type { ProductLineId } from '../models/ProductLine';
import { isProFamilyLine } from '../utils/productLineResolution';
import { DISCOVER_UNIVERSE_CARDS } from './discoverChapters';
import { DISCOVER_UNIVERSE_CARDS_PRO } from './discoverProContent';
import { DISCOVER_UNIVERSE_CARDS_AMATEUR } from './discoverAmateurContent';
import { DISCOVER_UNIVERSE_CARDS_SUPPORTER } from './discoverSupporterContent';
import { DISCOVER_UNIVERSE_CARDS_SPONSOR } from './discoverSponsorContent';

function resolveDiscoverLine(line: ProductLineId): ProductLineId {
  if (line === 'homme' || line === 'woman' || line === 'pro') return 'amateur';
  // Santé n’est plus un pôle vitrine : soins intégrés au parcours Joueur.
  if (line === 'sante') return 'amateur';
  if (line === 'pro_player' || line === 'pro_club' || line === 'pro_staff') return line;
  if (line === 'sponsor') return 'sponsor';
  if (isProFamilyLine(line)) return 'pro_player';
  return line;
}

export function getDiscoverUniverseCards(line: ProductLineId) {
  const resolved = resolveDiscoverLine(line);
  if (resolved === 'pro_player' || resolved === 'pro_club' || resolved === 'pro_staff') {
    return DISCOVER_UNIVERSE_CARDS_PRO;
  }
  if (resolved === 'amateur') return DISCOVER_UNIVERSE_CARDS_AMATEUR;
  if (resolved === 'supporter') return DISCOVER_UNIVERSE_CARDS_SUPPORTER;
  if (resolved === 'sponsor') return DISCOVER_UNIVERSE_CARDS_SPONSOR;
  return DISCOVER_UNIVERSE_CARDS;
}
