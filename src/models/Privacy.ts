/**
 * Privacy & medical confidentiality — document vault, grants, audit.
 * Identity verification docs remain under users/{uid}/documents.
 */

export type PrivacyResourceType = 'personal_document' | 'medical_document' | 'medical_appointment';

export type PrivacyGrantScope = 'resource' | 'all_medical' | 'all_personal';

export type PrivacyPermission = 'read' | 'download';

export type PrivacyAuditAction =
  | 'view'
  | 'download'
  | 'create'
  | 'update'
  | 'delete'
  | 'grant'
  | 'revoke'
  | 'notice_ack'
  | 'admin_break_glass';

export type PersonalDocumentCategory =
  | 'identity'
  | 'license'
  | 'cv'
  | 'certificate'
  | 'other';

export type MedicalDocumentType =
  | 'record'
  | 'prescription_scan'
  | 'note_attachment'
  | 'imaging'
  | 'other';

export interface PersonalDocument {
  id: string;
  owner_uid: string;
  title: string;
  category: PersonalDocumentCategory;
  storage_path: string;
  mime_type: string;
  size_bytes?: number;
  visibility: 'private';
  created_at: Date;
  updated_at: Date;
}

export interface MedicalDocument {
  id: string;
  patient_uid: string;
  title: string;
  type: MedicalDocumentType;
  storage_path: string;
  mime_type: string;
  size_bytes?: number;
  appointment_id?: string | null;
  uploaded_by_uid: string;
  visibility: 'private';
  created_at: Date;
  updated_at: Date;
}

export interface PrivacyAccessGrant {
  id: string;
  /** Patient / owner who issued the grant */
  owner_uid: string;
  grantee_uid: string;
  resource_type: PrivacyResourceType;
  /** When scope is resource — specific doc / appointment id */
  resource_id?: string | null;
  scope: PrivacyGrantScope;
  permissions: PrivacyPermission[];
  purpose?: string | null;
  expires_at?: Date | null;
  revoked_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PrivacyAuditEntry {
  id: string;
  actor_uid: string;
  action: PrivacyAuditAction;
  resource_type: PrivacyResourceType | 'privacy_notice' | 'privacy_grant';
  resource_id: string;
  owner_uid?: string | null;
  context?: string | null;
  created_at: Date;
}

export interface CreatePersonalDocumentInput {
  owner_uid: string;
  title: string;
  category: PersonalDocumentCategory;
  storage_path: string;
  mime_type: string;
  size_bytes?: number;
}

export interface CreateMedicalDocumentInput {
  patient_uid: string;
  title: string;
  type: MedicalDocumentType;
  storage_path: string;
  mime_type: string;
  size_bytes?: number;
  appointment_id?: string | null;
  uploaded_by_uid: string;
}

export interface CreatePrivacyGrantInput {
  owner_uid: string;
  grantee_uid: string;
  resource_type: PrivacyResourceType;
  resource_id?: string | null;
  scope: PrivacyGrantScope;
  permissions: PrivacyPermission[];
  purpose?: string | null;
  expires_at?: Date | null;
}
