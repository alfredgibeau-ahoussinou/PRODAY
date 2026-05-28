import { useCallback, useEffect, useState } from 'react';
import { getFirebaseAuth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { isPlatformAdminEmail } from '../config/admin';

export function useIsAdmin() {
  const { firebaseUser, profile } = useAuth();
  const [hasAdminClaim, setHasAdminClaim] = useState(false);
  const [claimLoading, setClaimLoading] = useState(true);

  const refreshAdminClaim = useCallback(async () => {
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    if (!user) {
      setHasAdminClaim(false);
      setClaimLoading(false);
      return false;
    }
    setClaimLoading(true);
    try {
      const token = await user.getIdTokenResult(true);
      const admin = token.claims.admin === true;
      setHasAdminClaim(admin);
      return admin;
    } catch {
      setHasAdminClaim(false);
      return false;
    } finally {
      setClaimLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAdminClaim();
  }, [firebaseUser?.uid, refreshAdminClaim]);

  const emailHint = isPlatformAdminEmail(profile?.email ?? firebaseUser?.email);
  const isAdmin = hasAdminClaim;
  const needsSetup = emailHint && !hasAdminClaim && !claimLoading;

  return {
    isAdmin,
    hasAdminClaim,
    claimLoading,
    needsSetup,
    emailHint,
    refreshAdminClaim,
  };
}
