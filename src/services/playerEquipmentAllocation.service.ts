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
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  PlayerAssignedEquipment,
  AllocateEquipmentInput,
  AssignedEquipmentStatus,
  EquipmentExchangeStatus,
} from '../models/PlayerAssignedEquipment';

const COL = 'player_assigned_equipment';

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

function mapDoc(id: string, data: Record<string, unknown>): PlayerAssignedEquipment {
  return {
    id,
    club_id: String(data.club_id ?? ''),
    player_uid: String(data.player_uid ?? ''),
    player_name: String(data.player_name ?? ''),
    item_name: String(data.item_name ?? ''),
    category: (data.category as PlayerAssignedEquipment['category']) ?? 'kit',
    size: data.size ? String(data.size) : undefined,
    barcode_or_ref: data.barcode_or_ref ? String(data.barcode_or_ref) : undefined,
    assigned_date: toDate(data.assigned_date),
    status: (data.status as AssignedEquipmentStatus) ?? 'allocated',
    received_at: data.received_at ? toDate(data.received_at) : undefined,
    exchange_status: (data.exchange_status as EquipmentExchangeStatus) ?? 'none',
    exchange_requested_size: data.exchange_requested_size ? String(data.exchange_requested_size) : undefined,
    exchange_reason: data.exchange_reason ? String(data.exchange_reason) : undefined,
    exchange_requested_at: data.exchange_requested_at ? toDate(data.exchange_requested_at) : undefined,
    issue_description: data.issue_description ? String(data.issue_description) : undefined,
    issue_reported_at: data.issue_reported_at ? toDate(data.issue_reported_at) : undefined,
    return_requested_at: data.return_requested_at ? toDate(data.return_requested_at) : undefined,
    return_validated_at: data.return_validated_at ? toDate(data.return_validated_at) : undefined,
    return_validated_by: data.return_validated_by ? String(data.return_validated_by) : undefined,
    staff_notes: data.staff_notes ? String(data.staff_notes) : undefined,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

export const playerEquipmentAllocationService = {
  /**
   * Attribue un équipement à un joueur (action staff club).
   */
  async allocateItem(input: AllocateEquipmentInput): Promise<PlayerAssignedEquipment> {
    const database = getDb();
    const now = new Date();

    const payload: Record<string, unknown> = {
      club_id: input.club_id,
      player_uid: input.player_uid,
      player_name: input.player_name,
      item_name: input.item_name.trim(),
      category: input.category,
      size: input.size?.trim() ?? null,
      barcode_or_ref: input.barcode_or_ref?.trim() ?? null,
      assigned_date: Timestamp.fromDate(now),
      status: 'allocated',
      received_at: null,
      exchange_status: 'none',
      exchange_requested_size: null,
      exchange_reason: null,
      exchange_requested_at: null,
      issue_description: null,
      issue_reported_at: null,
      return_requested_at: null,
      return_validated_at: null,
      return_validated_by: null,
      staff_notes: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    let id = `eq_${Date.now()}`;
    if (database && isFirebaseConfigured()) {
      const ref = await addDoc(collection(database, COL), payload);
      id = ref.id;
    }

    return {
      id,
      club_id: input.club_id,
      player_uid: input.player_uid,
      player_name: input.player_name,
      item_name: input.item_name.trim(),
      category: input.category,
      size: input.size?.trim(),
      barcode_or_ref: input.barcode_or_ref?.trim(),
      assigned_date: now,
      status: 'allocated',
      exchange_status: 'none',
      created_at: now,
      updated_at: now,
    };
  },

  /**
   * Liste les équipements assignés à un joueur.
   */
  async listForPlayer(playerUid: string): Promise<PlayerAssignedEquipment[]> {
    const database = getDb();
    if (!database || !isFirebaseConfigured() || !playerUid) return [];
    try {
      const q = query(
        collection(database, COL),
        where('player_uid', '==', playerUid),
        orderBy('assigned_date', 'desc'),
        limit(50),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL), where('player_uid', '==', playerUid), limit(50)),
      );
      return snap.docs
        .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.assigned_date.getTime() - a.assigned_date.getTime());
    }
  },

  /**
   * Liste les équipements du club pour le staff.
   */
  async listForClub(clubId: string, max = 100): Promise<PlayerAssignedEquipment[]> {
    const database = getDb();
    if (!database || !isFirebaseConfigured() || !clubId) return [];
    try {
      const q = query(
        collection(database, COL),
        where('club_id', '==', clubId),
        orderBy('assigned_date', 'desc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL), where('club_id', '==', clubId), limit(max)),
      );
      return snap.docs
        .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.assigned_date.getTime() - a.assigned_date.getTime());
    }
  },

  /**
   * Le joueur confirme la bonne réception de l'équipement.
   */
  async confirmReceipt(id: string, playerUid: string): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    const ref = doc(database, COL, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    if (snap.data().player_uid !== playerUid) throw new Error('Accès non autorisé.');

    await updateDoc(ref, {
      status: 'received',
      received_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  },

  /**
   * Le joueur demande un échange de taille.
   */
  async requestSizeExchange(
    id: string,
    playerUid: string,
    requestedSize: string,
    reason?: string,
  ): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    const ref = doc(database, COL, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    if (snap.data().player_uid !== playerUid) throw new Error('Accès non autorisé.');

    await updateDoc(ref, {
      exchange_status: 'size_exchange_requested',
      exchange_requested_size: requestedSize.trim(),
      exchange_reason: reason?.trim() ?? null,
      exchange_requested_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  },

  /**
   * Le joueur signale un problème (déchirure, taille défectueuse, etc.).
   */
  async reportIssue(id: string, playerUid: string, description: string): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    const ref = doc(database, COL, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    if (snap.data().player_uid !== playerUid) throw new Error('Accès non autorisé.');

    await updateDoc(ref, {
      exchange_status: 'issue_reported',
      issue_description: description.trim(),
      issue_reported_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  },

  /**
   * Le joueur demande la restitution / retour de l'équipement (ex: fin de saison).
   */
  async requestReturn(id: string, playerUid: string): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    const ref = doc(database, COL, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    if (snap.data().player_uid !== playerUid) throw new Error('Accès non autorisé.');

    await updateDoc(ref, {
      status: 'return_pending',
      return_requested_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  },

  /**
   * Validation par le staff club d'un retour ou d'un échange (modifie l'état vérifié).
   */
  async validateStaffReturn(id: string, staffUid: string, notes?: string): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    await updateDoc(doc(database, COL, id), {
      status: 'returned',
      return_validated_at: serverTimestamp(),
      return_validated_by: staffUid,
      staff_notes: notes?.trim() ?? null,
      exchange_status: 'resolved',
      updated_at: serverTimestamp(),
    });
  },
};
