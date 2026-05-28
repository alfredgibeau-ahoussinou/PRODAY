import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import {
  stageOfferFromFirestore,
  stageApplicationFromFirestore,
} from '../lib/firestoreMappers';
import type { User } from '../models/User';
import type { AppSpaceId } from '../models/AppSpace';
import type { StageOffer, StageApplication } from '../models/Stage';
import { canPublishStages } from '../utils/roleCapabilities';

export const STAGE_APPLICATION_STATUS_LABEL: Record<
  StageApplication['status'],
  string
> = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
  WAITLIST: 'Liste d\'attente',
};

export function canManageStage(profile: User, stage: StageOffer): boolean {
  if (profile.uid === stage.author_uid) return true;
  if (!canPublishStages(profile.role)) return false;
  const clubId = profile.profile?.club_id;
  return Boolean(clubId && clubId === stage.club_id);
}

export const stagesService = {
  async listOpenOffers(max = 30): Promise<StageOffer[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'stage_offers'),
        where('status', '==', 'OPEN'),
        orderBy('start_date', 'asc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        stageOfferFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch (error) {
      console.error('[stagesService] listOpenOffers:', error);
      return [];
    }
  },

  async getOfferById(stageId: string): Promise<StageOffer | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, 'stage_offers', stageId));
    if (!snap.exists()) return null;
    return stageOfferFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  async createOffer(input: {
    author_uid: string;
    club_id: string;
    club_name: string;
    title: string;
    description: string;
    city: string;
    category: string;
    start_date: Date;
    end_date: Date;
    price_eur?: number;
    spots_total: number;
    target_space?: AppSpaceId;
  }): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = await addDoc(collection(database, 'stage_offers'), {
      ...input,
      start_date: input.start_date,
      end_date: input.end_date,
      spots_taken: 0,
      status: 'OPEN',
      created_at: serverTimestamp(),
    });
    return ref.id;
  },

  async hasPlayerApplied(stageId: string, playerUid: string): Promise<boolean> {
    if (!isFirebaseConfigured()) return false;
    const database = getDb();
    if (!database) return false;
    const q = query(
      collection(database, 'stage_applications'),
      where('stage_id', '==', stageId),
      where('player_uid', '==', playerUid),
      limit(1)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  },

  async apply(input: {
    stage_id: string;
    stage_author_uid: string;
    player_uid: string;
    player_name: string;
    message: string;
  }): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const stage = await this.getOfferById(input.stage_id);
    if (!stage || stage.status !== 'OPEN') {
      throw new Error('Ce stage n\'accepte plus de candidatures.');
    }
    if (stage.spots_taken >= stage.spots_total) {
      throw new Error('Plus de place disponible sur ce stage.');
    }

    const ref = await addDoc(collection(database, 'stage_applications'), {
      ...input,
      status: 'PENDING',
      created_at: serverTimestamp(),
    });

    await updateDoc(doc(database, 'stage_offers', input.stage_id), {
      spots_taken: increment(1),
    });

    return ref.id;
  },

  async listMyApplications(playerUid: string): Promise<StageApplication[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    const q = query(
      collection(database, 'stage_applications'),
      where('player_uid', '==', playerUid),
      orderBy('created_at', 'desc'),
      limit(40)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
      stageApplicationFromFirestore(d.id, d.data() as Record<string, unknown>)
    );
  },
};
