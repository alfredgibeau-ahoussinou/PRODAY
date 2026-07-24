import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { User } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';
import {
  needsProductLineMigration,
  resolvePersistedProductLine,
} from '../utils/productLineResolution';

/** Migration client des lignes legacy (`pro`, `homme`, `woman`) vers les pôles canoniques. */
export const productLineMigrationService = {
  resolveTargetLine(user: User): ProductLineId | null {
    if (!needsProductLineMigration(user.product_line)) return null;
    return resolvePersistedProductLine(user.product_line, user.role);
  },

  async migrateUserIfNeeded(user: User): Promise<User> {
    const target = this.resolveTargetLine(user);
    if (!target || target === user.product_line) return user;

    const genderFromLegacy =
      user.product_line === 'woman' && !user.profile?.gender
        ? ('women' as const)
        : user.product_line === 'homme' && !user.profile?.gender
          ? ('men' as const)
          : null;

    const nextProfile = genderFromLegacy
      ? { ...user.profile, gender: genderFromLegacy }
      : user.profile;

    if (!isFirebaseConfigured()) {
      return { ...user, product_line: target, profile: nextProfile };
    }
    const database = getDb();
    if (!database) {
      return { ...user, product_line: target, profile: nextProfile };
    }

    const updates: Record<string, unknown> = {
      product_line: target,
      updated_at: serverTimestamp(),
    };
    if (genderFromLegacy) {
      updates['profile.gender'] = genderFromLegacy;
    }

    await updateDoc(doc(database, 'users', user.uid), updates);
    return { ...user, product_line: target, profile: nextProfile };
  },
};
