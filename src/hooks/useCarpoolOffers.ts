import { useCallback, useEffect, useState } from 'react';
import { carpoolOffersService } from '../services/carpoolOffers.service';
import type { StandaloneCarpoolOffer } from '../models/StandaloneCarpoolOffer';

export function useCarpoolOffers(driverUid?: string, viewerClubId?: string) {
  const [offers, setOffers] = useState<StandaloneCarpoolOffer[]>([]);
  const [myOffers, setMyOffers] = useState<StandaloneCarpoolOffer[]>([]);
  const [allOffers, setAllOffers] = useState<StandaloneCarpoolOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [open, mine, all] = await Promise.all([
      carpoolOffersService.listOpen(40, viewerClubId),
      driverUid ? carpoolOffersService.listByDriver(driverUid) : Promise.resolve([]),
      driverUid ? carpoolOffersService.listForUser(driverUid, viewerClubId) : Promise.resolve([]),
    ]);
    setOffers(open);
    setMyOffers(mine);
    setAllOffers(all);
    setLoading(false);
  }, [driverUid, viewerClubId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { offers, myOffers, allOffers, loading, refresh };
}
