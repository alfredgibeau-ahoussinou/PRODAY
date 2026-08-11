import { useEffect, useState } from 'react';
import { usersService } from '../services/users.service';
import { resolveClubCoversCoachFromMembers } from '../utils/clubFeatureAccess';

/**
 * Charge si le club du coach a une offre « coachs inclus » (Tout inclus / Pro+Veo).
 */
export function useClubCoversCoach(clubId: string | undefined | null): boolean {
  const [covers, setCovers] = useState(false);

  useEffect(() => {
    if (!clubId) {
      setCovers(false);
      return;
    }
    let cancelled = false;
    void usersService.listMembersByClubId(clubId).then((members) => {
      if (cancelled) return;
      setCovers(resolveClubCoversCoachFromMembers(members));
    });
    return () => {
      cancelled = true;
    };
  }, [clubId]);

  return covers;
}
