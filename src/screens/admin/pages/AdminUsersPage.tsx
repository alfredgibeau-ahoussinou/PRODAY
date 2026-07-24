import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTranslation } from '../../../context/LocaleContext';
import { AdminFilterChips } from '../../../components/admin/AdminFilterChips';
import type { User, UserRole } from '../../../models/User';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminService } from '../../../services/admin.service';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminUserCard } from '../../../components/admin/AdminUserCard';
import { AdminSearchField } from '../../../components/admin/AdminSearchField';
import { AdminKpiStrip } from '../../../components/admin/AdminKpiStrip';
import { AdminSectionHeader } from '../../../components/admin/AdminSectionHeader';
import { AdminEmptyState } from '../../../components/admin/AdminEmptyState';
import {
  AdminCreateUserPanel,
  type CreateUserFormState,
} from '../../../components/admin/AdminCreateUserPanel';
import { AdminUserEditModal, AdminRejectModal } from '../../../components/admin/AdminUserModals';
import { AdminUserDocumentsModal } from '../../../components/admin/AdminUserDocumentsModal';
import { adminConfirmDelete, adminActionErrorAlert } from '../../../utils/adminConfirm';
import { userNeedsAdminVerificationReview } from '../../../utils/adminUserVerification';
import { getErrorMessage } from '../../../utils/errors';
import { useAdminStyles } from '../../../components/admin/adminStyles';
import { spacing, radius } from '../../../theme/designTokens';
import type { AppColors } from '../../../theme/universeTheme';

import { getRoleLabel } from '../../signup/signupFlowConfig';
import {
  ADMIN_EDIT_ROLES,
  ADMIN_PRODUCT_LINES,
  adminProductLineLabel,
  resolveAdminProductLine,
} from '../../../utils/adminProductLine';
import { getUserProductLine } from '../../../utils/productLineAccess';
import type { ProductLineId } from '../../../models/ProductLine';
import { MEDICAL_CANONICAL_LABELS } from '../../../screens/signup/signupMedicalI18n';

type UserListFilter = 'all' | 'pending' | UserRole | `line:${ProductLineId}`;

const EMPTY_FORM: CreateUserFormState = {
  email: '',
  password: '',
  display_name: '',
  city: '',
  role: 'player',
  product_line: 'pro_player',
};

export const AdminUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const { loading, users, userDocCounts, refresh, stats } = useAdminData();
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const [listFilter, setListFilter] = useState<UserListFilter>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserFormState>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [rejectUser, setRejectUser] = useState<User | null>(null);
  const [documentsUser, setDocumentsUser] = useState<User | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [approvingUid, setApprovingUid] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    if (listFilter === 'pending' && !userNeedsAdminVerificationReview(u)) return false;
    if (listFilter.startsWith('line:')) {
      const line = listFilter.slice(5) as ProductLineId;
      if (getUserProductLine(u) !== line) return false;
    } else if (listFilter !== 'all' && listFilter !== 'pending' && u.role !== listFilter) {
      return false;
    }
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const lineLabel = adminProductLineLabel(getUserProductLine(u)).toLowerCase();
    return (
      u.display_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.city?.toLowerCase().includes(q) ?? false) ||
      lineLabel.includes(q) ||
      (u.product_line?.toLowerCase().includes(q) ?? false)
    );
  });

  const handleApprove = async (u: User) => {
    setApprovingUid(u.uid);
    try {
      const result = await adminService.validateProfile(u.uid, 'approve');
      Alert.alert(
        t('admin.users.confirmed'),
        result.via === 'firestore'
          ? `${u.display_name} est vérifié (sans notification push — déployez les Functions pour les alertes automatiques).`
          : `${u.display_name} est vérifié. Une notification a été envoyée.`
      );
      await refresh();
    } catch (e) {
      adminActionErrorAlert(e, 'Confirmation impossible');
    } finally {
      setApprovingUid(null);
    }
  };

  const handleCreate = async () => {
    const { email, password, display_name, city, role, product_line, medical_specialty } =
      createForm;
    if (!email.trim() || !password || !display_name.trim()) {
      Alert.alert('Champs requis', 'Email, mot de passe et nom sont obligatoires.');
      return;
    }
    setCreating(true);
    try {
      const specialtyLabel =
        role === 'physio'
          ? MEDICAL_CANONICAL_LABELS[medical_specialty ?? 'kine']
          : undefined;
      await adminService.createUser({
        email: email.trim(),
        password,
        display_name: display_name.trim(),
        role,
        city: city.trim() || undefined,
        product_line: resolveAdminProductLine(role, product_line),
        medical_specialty: specialtyLabel,
      });
      Alert.alert(t('admin.users.created'), t('admin.users.createdBody', { email }));
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      await refresh();
    } catch (e) {
      Alert.alert(t('common.error'), getErrorMessage(e, t('admin.users.createFailed')));
    } finally {
      setCreating(false);
    }
  };

  const pendingCount = users.filter((u) => userNeedsAdminVerificationReview(u)).length;
  const activeCount = users.filter((u) => u.is_active !== false).length;

  return (
    <AdminPageScaffold loading={loading}>
      <AdminKpiStrip
        items={[
          { key: 'all', label: 'Comptes chargés', value: users.length, icon: 'people' },
          { key: 'active', label: 'Actifs', value: activeCount, icon: 'people' },
          {
            key: 'pending',
            label: 'Vérif. en attente',
            value: pendingCount,
            icon: 'warning',
            alert: pendingCount > 0,
          },
          {
            key: 'platform',
            label: 'Total plateforme',
            value: stats?.users ?? users.length,
            icon: 'document',
          },
        ]}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(!showCreate)}>
        <Text style={styles.fabText}>{showCreate ? t('admin.users.createToggle.close') : t('admin.users.createToggle.open')}</Text>
      </TouchableOpacity>

      <AdminCreateUserPanel
        visible={showCreate}
        form={createForm}
        onChange={(patch) => setCreateForm((f) => ({ ...f, ...patch }))}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        submitting={creating}
      />

      <AdminSearchField value={search} onChangeText={setSearch} placeholder="Nom, email, ville…" />

      <AdminFilterChips
        options={[
          { id: 'all' as const, label: 'Tous' },
          { id: 'pending' as const, label: t('admin.users.verifyPending') },
          ...ADMIN_PRODUCT_LINES.map((line) => ({
            id: `line:${line}` as const,
            label: adminProductLineLabel(line),
          })),
          ...ADMIN_EDIT_ROLES.map((r) => ({ id: r, label: getRoleLabel(r, t) })),
        ]}
        value={listFilter}
        onChange={setListFilter}
      />

      <AdminSectionHeader title="Comptes" count={filtered.length} />

      {filtered.length === 0 ? (
        <AdminEmptyState icon="people" title="Aucun utilisateur" subtitle="Modifiez les filtres." />
      ) : (
        filtered.map((u) => (
          <AdminUserCard
            key={u.uid}
            user={u}
            documentsCount={userDocCounts[u.uid]}
            approving={approvingUid === u.uid}
            onEdit={() => setEditUser(u)}
            onViewDocuments={() => setDocumentsUser(u)}
            onApprove={
              userNeedsAdminVerificationReview(u)
                ? () => void handleApprove(u)
                : undefined
            }
            onReject={
              userNeedsAdminVerificationReview(u) ? () => setRejectUser(u) : undefined
            }
            onToggleActive={() =>
              adminService
                .updateUser(u.uid, { is_active: u.is_active === false })
                .then(() => refresh())
                .catch((e) => adminActionErrorAlert(e, t('admin.users.updateFailed')))
            }
            onDelete={() =>
              adminConfirmDelete(
                'Supprimer l’utilisateur',
                `Supprimer ${u.display_name} ? Irréversible.`,
                () => adminService.deleteUserFull(u.uid),
                refresh
              )
            }
          />
        ))
      )}

      <AdminUserDocumentsModal
        visible={Boolean(documentsUser)}
        user={documentsUser}
        onClose={() => setDocumentsUser(null)}
      />
      <AdminUserEditModal
        visible={Boolean(editUser)}
        user={editUser}
        saving={savingUser}
        onClose={() => setEditUser(null)}
        onSave={async (patch) => {
          if (!editUser) return;
          setSavingUser(true);
          try {
            await adminService.updateUser(editUser.uid, {
              display_name: patch.display_name,
              city: patch.city,
              role: patch.role,
              product_line: patch.product_line,
              verification_status: patch.verification_status,
              is_verified: patch.is_verified,
              sponsor_approved: patch.sponsor_approved,
              job_title: patch.job_title,
              medical_specialty: patch.medical_specialty,
            });
            setEditUser(null);
            await refresh();
            Alert.alert(t('admin.users.saved'), t('admin.users.profileUpdated'));
          } catch (e) {
            adminActionErrorAlert(e, 'Mise à jour impossible.');
          } finally {
            setSavingUser(false);
          }
        }}
      />
      <AdminRejectModal
        visible={Boolean(rejectUser)}
        userName={rejectUser?.display_name ?? ''}
        submitting={rejecting}
        onClose={() => setRejectUser(null)}
        onConfirm={async (reason) => {
          if (!rejectUser) return;
          setRejecting(true);
          try {
            const result = await adminService.validateProfile(
              rejectUser.uid,
              'reject',
              reason || undefined
            );
            setRejectUser(null);
            await refresh();
            Alert.alert(
              t('admin.users.rejected'),
              result.via === 'firestore'
                ? t('admin.users.rejectedPush')
                : t('admin.users.rejectedNotify')
            );
          } catch (e) {
            adminActionErrorAlert(e, 'Rejet impossible');
          } finally {
            setRejecting(false);
          }
        }}
      />
    </AdminPageScaffold>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    fab: {
      backgroundColor: c.brand,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    fabText: { color: c.brandInverse, fontWeight: '800', fontSize: 14 },
  });
}
