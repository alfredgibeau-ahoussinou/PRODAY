import React, { useMemo, useState } from 'react';
import { useTranslation } from '../../../context/LocaleContext';
import {
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import type { User, UserRole } from '../../../models/User';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminService } from '../../../services/admin.service';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminUserCard } from '../../../components/admin/AdminUserCard';
import { AdminSearchField } from '../../../components/admin/AdminSearchField';
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

const ROLES: UserRole[] = ['player', 'coach', 'club', 'agent', 'recruiter', 'organizer', 'physio', 'sponsor'];

const EMPTY_FORM: CreateUserFormState = {
  email: '',
  password: '',
  display_name: '',
  city: '',
  role: 'player',
};

export const AdminUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const { loading, users, userDocCounts, refresh } = useAdminData();
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [pendingOnly, setPendingOnly] = useState(false);
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
    if (pendingOnly && !userNeedsAdminVerificationReview(u)) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.display_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.city?.toLowerCase().includes(q) ?? false)
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
    const { email, password, display_name, city, role } = createForm;
    if (!email.trim() || !password || !display_name.trim()) {
      Alert.alert('Champs requis', 'Email, mot de passe et nom sont obligatoires.');
      return;
    }
    setCreating(true);
    try {
      await adminService.createUser({
        email: email.trim(),
        password,
        display_name: display_name.trim(),
        role,
        city: city.trim() || undefined,
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

  return (
    <AdminPageScaffold
      title="Utilisateurs"
      subtitle={t('admin.users.subtitle')}
      loading={loading}
    >
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        <FilterPill
          label="Tous"
          active={roleFilter === 'all' && !pendingOnly}
          onPress={() => {
            setRoleFilter('all');
            setPendingOnly(false);
          }}
          styles={styles}
        />
        <FilterPill
          label={t('admin.users.verifyPending')}
          active={pendingOnly}
          onPress={() => {
            setPendingOnly(true);
            setRoleFilter('all');
          }}
          styles={styles}
        />
        {ROLES.map((r) => (
          <FilterPill
            key={r}
            label={getRoleLabel(r, t)}
            active={roleFilter === r && !pendingOnly}
            onPress={() => {
              setRoleFilter(r);
              setPendingOnly(false);
            }}
            styles={styles}
          />
        ))}
      </ScrollView>

      <AdminSectionHeader title="COMPTES" count={filtered.length} />

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
            await adminService.updateUser(editUser.uid, patch);
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

type UsersPageStyles = ReturnType<typeof createStyles>;

const FilterPill: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  styles: UsersPageStyles;
}> = ({ label, active, onPress, styles }) => (
  <TouchableOpacity style={[styles.pill, active && styles.pillOn]} onPress={onPress}>
    <Text style={[styles.pillText, active && styles.pillTextOn]}>{label}</Text>
  </TouchableOpacity>
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
    fab: {
      backgroundColor: c.ink,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    fabText: { color: c.brandInverse, fontWeight: '900', fontSize: 14 },
    filters: { maxHeight: 44, marginBottom: spacing.sm },
    pill: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      marginRight: spacing.sm,
    },
    pillOn: { backgroundColor: c.ink, borderColor: c.ink },
    pillText: { fontSize: 12, fontWeight: '800', color: c.text },
    pillTextOn: { color: c.brandInverse },
  });
}
