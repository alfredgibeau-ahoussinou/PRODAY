import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getDb, getFirebaseStorage } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { CreateTeamDocumentInput, TeamDocument } from '../models/TeamDocument';

const COL = 'team_documents';

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  return new Date(0);
}

function mapDoc(id: string, data: Record<string, unknown>): TeamDocument {
  return {
    id,
    club_id: String(data.club_id ?? ''),
    team_id: data.team_id ? String(data.team_id) : undefined,
    title: String(data.title ?? ''),
    kind: (data.kind as TeamDocument['kind']) ?? 'other',
    storage_path: String(data.storage_path ?? ''),
    download_url: data.download_url ? String(data.download_url) : undefined,
    mime_type: data.mime_type ? String(data.mime_type) : undefined,
    uploaded_by: String(data.uploaded_by ?? ''),
    uploaded_by_name: String(data.uploaded_by_name ?? ''),
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

export const teamDocumentsService = {
  async listForClub(clubId: string, max = 40): Promise<TeamDocument[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(
          collection(database, COL),
          where('club_id', '==', clubId),
          orderBy('created_at', 'desc'),
          limit(max),
        ),
      );
      return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL), where('club_id', '==', clubId), limit(max)),
      );
      return snap.docs
        .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
  },

  async create(
    uploadedBy: string,
    uploadedByName: string,
    input: CreateTeamDocumentInput,
  ): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const refDoc = await addDoc(collection(database, COL), {
      club_id: input.club_id,
      team_id: input.team_id ?? null,
      title: input.title.trim(),
      kind: input.kind,
      storage_path: input.storage_path,
      download_url: input.download_url ?? null,
      mime_type: input.mime_type ?? null,
      uploaded_by: uploadedBy,
      uploaded_by_name: uploadedByName,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return refDoc.id;
  },

  async uploadAndCreate(
    uploadedBy: string,
    uploadedByName: string,
    clubId: string,
    file: { uri: string; name: string; mimeType?: string },
    kind: TeamDocument['kind'] = 'other',
  ): Promise<string> {
    const storage = getFirebaseStorage();
    if (!storage) throw new Error('Storage non configuré');
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `team_vault/${clubId}/${Date.now()}_${safeName}`;
    const response = await fetch(file.uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob, {
      contentType: file.mimeType ?? blob.type ?? 'application/octet-stream',
    });
    const url = await getDownloadURL(storageRef);
    return this.create(uploadedBy, uploadedByName, {
      club_id: clubId,
      title: file.name,
      kind,
      storage_path: path,
      download_url: url,
      mime_type: file.mimeType,
    });
  },
};
