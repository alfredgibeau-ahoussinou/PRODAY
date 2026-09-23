import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { membershipsService } from '../services/memberships.service';
import type { Membership } from '../models/Membership';
import { resolveUserDestination, type UserDestination } from '../navigation/membershipRouting';

export function useUserMembershipState() {
  const { profile, loading: authLoading } = useAuth();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!profile?.uid) {
      setMemberships([]);
      setLoading(false);
      return;
    }
    try {
      const list = await membershipsService.listByPlayer(profile.uid);
      setMemberships(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [profile?.uid]);

  useEffect(() => {
    if (!profile?.uid) {
      setMemberships([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Realtime subscription to memberships changes
    const unsubscribe = membershipsService.subscribeByPlayer(profile.uid, (list) => {
      setMemberships(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  const destination: UserDestination = useMemo(() => {
    if (authLoading || loading) {
      return { kind: 'guest' };
    }
    return resolveUserDestination(profile, memberships);
  }, [authLoading, loading, profile, memberships]);

  return {
    memberships,
    destination,
    loading: authLoading || loading,
    refresh,
  };
}
