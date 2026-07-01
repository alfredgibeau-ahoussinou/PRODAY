import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { User } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';
import {
  needsProductLineMigration,
  resolvePersistedProductLine,
} from '../utils/productLineResolution';

/** Migration client `product_line: pro` → pro_player | pro_club | pro_staff. */
export const productLineMigrationService = {
  resolveTargetLine(user: User): ProductLineId | null {
    if (!needsProductLineMigration(user.product_line)) return null;
    return resolvePersistedProductLine('pro', user.role);
  },

  async migrateUserIfNeeded(user: User): Promise<User> {
    const target = this.resolveTargetLine(user);
    if (!target || target === user.product_line) return user;
    if (!isFirebaseConfigured()) {
      return { ...user, product_line: target };
    }
    const database = getDb();
    if (!database) return { ...user, product_line: target };

    await updateDoc(doc(database, 'users', user.uid), {
      product_line: target,
      updated_at: serverTimestamp(),
    });
    return { ...user, product_line: target };
  },
};
