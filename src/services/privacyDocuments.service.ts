import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { storageService, type UploadFileInput } from './storage.service';
import { privacyAuditService } from './privacyGrants.service';
import type {
  CreateMedicalDocumentInput,
  CreatePersonalDocumentInput,
  MedicalDocument,
  MedicalDocumentType,
  PersonalDocument,
  PersonalDocumentCategory,
} from '../models/Privacy';

const COL_PERSONAL = 'personal_documents';
const COL_MEDICAL = 'medical_documents';

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  return new Date();
}

function mapPersonal(id: string, data: Record<string, unknown>): PersonalDocument {
  return {
    id,
    owner_uid: String(data.owner_uid ?? ''),
    title: String(data.title ?? ''),
    category: (data.category as PersonalDocumentCategory) ?? 'other',
    storage_path: String(data.storage_path ?? ''),
    mime_type: String(data.mime_type ?? 'application/octet-stream'),
    size_bytes: typeof data.size_bytes === 'number' ? data.size_bytes : undefined,
    visibility: 'private',
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

function mapMedical(id: string, data: Record<string, unknown>): MedicalDocument {
  return {
    id,
    patient_uid: String(data.patient_uid ?? ''),
    title: String(data.title ?? ''),
    type: (data.type as MedicalDocumentType) ?? 'other',
    storage_path: String(data.storage_path ?? ''),
    mime_type: String(data.mime_type ?? 'application/octet-stream'),
    size_bytes: typeof data.size_bytes === 'number' ? data.size_bytes : undefined,
    appointment_id: data.appointment_id ? String(data.appointment_id) : null,
    uploaded_by_uid: String(data.uploaded_by_uid ?? ''),
    visibility: 'private',
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

function requireDb() {
  if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
  const database = getDb();
  if (!database) throw new Error('Firebase non configuré');
  return database;
}

export const privacyDocumentsService = {
  async uploadPersonalDocument(input: {
    owner_uid: string;
    title: string;
    category: PersonalDocumentCategory;
    file: UploadFileInput;
  }): Promise<string> {
    const { path } = await storageService.uploadPersonalVaultFile(
      input.owner_uid,
      input.file,
      input.category,
    );
    return this.createPersonalMetadata({
      owner_uid: input.owner_uid,
      title: input.title,
      category: input.category,
      storage_path: path,
      mime_type: input.file.mimeType,
    });
  },

  async createPersonalMetadata(input: CreatePersonalDocumentInput): Promise<string> {
    const database = requireDb();
    const ref = doc(collection(database, COL_PERSONAL));
    await setDoc(ref, {
      owner_uid: input.owner_uid,
      title: input.title.trim(),
      category: input.category,
      storage_path: input.storage_path,
      mime_type: input.mime_type,
      size_bytes: input.size_bytes ?? null,
      visibility: 'private',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    await privacyAuditService.log({
      actor_uid: input.owner_uid,
      action: 'create',
      resource_type: 'personal_document',
      resource_id: ref.id,
      owner_uid: input.owner_uid,
    });
    return ref.id;
  },

  async listPersonal(ownerUid: string, max = 40): Promise<PersonalDocument[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, COL_PERSONAL),
        where('owner_uid', '==', ownerUid),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapPersonal(d.id, d.data() as Record<string, unknown>));
    } catch {
      return [];
    }
  },

  async uploadMedicalDocument(input: {
    patient_uid: string;
    uploaded_by_uid: string;
    title: string;
    type: MedicalDocumentType;
    file: UploadFileInput;
    appointment_id?: string | null;
  }): Promise<string> {
    // Storage path owned by uploader (patient or physio) — ACL via metadata + CF
    const { path } = await storageService.uploadMedicalVaultFile(
      input.uploaded_by_uid,
      input.file,
      input.type,
    );
    return this.createMedicalMetadata({
      patient_uid: input.patient_uid,
      title: input.title,
      type: input.type,
      storage_path: path,
      mime_type: input.file.mimeType,
      appointment_id: input.appointment_id,
      uploaded_by_uid: input.uploaded_by_uid,
    });
  },

  async createMedicalMetadata(input: CreateMedicalDocumentInput): Promise<string> {
    const database = requireDb();
    const ref = doc(collection(database, COL_MEDICAL));
    await setDoc(ref, {
      patient_uid: input.patient_uid,
      title: input.title.trim(),
      type: input.type,
      storage_path: input.storage_path,
      mime_type: input.mime_type,
      size_bytes: input.size_bytes ?? null,
      appointment_id: input.appointment_id ?? null,
      uploaded_by_uid: input.uploaded_by_uid,
      visibility: 'private',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    await privacyAuditService.log({
      actor_uid: input.uploaded_by_uid,
      action: 'create',
      resource_type: 'medical_document',
      resource_id: ref.id,
      owner_uid: input.patient_uid,
    });
    return ref.id;
  },

  async listMedicalForPatient(patientUid: string, max = 40): Promise<MedicalDocument[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, COL_MEDICAL),
        where('patient_uid', '==', patientUid),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapMedical(d.id, d.data() as Record<string, unknown>));
    } catch {
      return [];
    }
  },

  async getMedical(docId: string): Promise<MedicalDocument | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, COL_MEDICAL, docId));
    if (!snap.exists()) return null;
    return mapMedical(snap.id, snap.data() as Record<string, unknown>);
  },

  async softDeleteMedical(docId: string, patientUid: string): Promise<void> {
    const database = requireDb();
    const ref = doc(database, COL_MEDICAL, docId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Document introuvable');
    if (String(snap.data()?.patient_uid) !== patientUid) throw new Error('Non autorisé');
    await updateDoc(ref, {
      title: '[supprimé]',
      storage_path: '',
      updated_at: serverTimestamp(),
    });
    await privacyAuditService.log({
      actor_uid: patientUid,
      action: 'delete',
      resource_type: 'medical_document',
      resource_id: docId,
      owner_uid: patientUid,
    });
  },

  /**
   * Short-lived URL via Cloud Function (RBAC + audit download).
   * Falls back to null if Functions unavailable.
   */
  async getSensitiveDownloadUrl(input: {
    resource_type: 'personal_document' | 'medical_document';
    resource_id: string;
  }): Promise<string | null> {
    if (!isFirebaseConfigured()) return null;
    try {
      const functions = getFunctions(getApp());
      const callable = httpsCallable<
        { resource_type: string; resource_id: string },
        { url: string }
      >(functions, 'getSensitiveDocumentUrl');
      const res = await callable(input);
      return res.data?.url ?? null;
    } catch (err) {
      console.warn('[privacyDocuments] getSensitiveDownloadUrl:', err);
      return null;
    }
  },
};
