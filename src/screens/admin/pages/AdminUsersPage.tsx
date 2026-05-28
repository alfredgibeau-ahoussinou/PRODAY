import React, { useState } from 'react';
import {
  View,
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
import { adminConfirmDelete, adminActionErrorAlert } from '../../../utils/adminConfirm';
import { getErrorMessage } from '../../../utils/errors';
import { colors, spacing, radius } from '../../../theme/designTokens';

const ROLES: UserRole[] = ['player', 'coach', 'club', 'agent', 'organizer', 'physio', 'sponsor'];
const ROLE_LABEL: Record<UserRole, string> = {
  player: 'Joueur',
  coach: 'Coach',
  club: 'Club',
  agent: 'Agent',
  organizer: 'Organisateur',
  sponsor: 'Sponsor',
  physio: 'Kinésithérapeute',
};

const EMPTY_FORM: CreateUserFormState = {
  email: '',
  password: '',
  display_name: '',
  city: '',
  role: 'player',
};

export const AdminUsersPage: React.FC = () => {
  const { loading, users, userDocCounts, refresh } = useAdminData();
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [pendingOnly, setPendingOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserFormState>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [rejectUser, setRejectUser] = useState<User | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [approvingUid, setApprovingUid] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    if (pendingOnly && u.verification_status !== 'PENDING') return false;
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
        'Compte confirmé',
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
      Alert.alert('Compte créé', `Utilisateur ${email} ajouté.`);
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      await refresh();
    } catch (e) {
      Alert.alert('Erreur', getErrorMessage(e, 'Création impossible.'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminPageScaffold
      title="Utilisateurs"
      subtitle="Création, rôles, vérifications, activation"
      loading={loading}
    >
      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(!showCreate)}>
        <Text style={styles.fabText}>{showCreate ? 'Fermer' : '+ Créer un compte'}</Text>
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
        />
        <FilterPill
          label="Vérif. attente"
          active={pendingOnly}
          onPress={() => {
            setPendingOnly(true);
            setRoleFilter('all');
          }}
        />
        {ROLES.map((r) => (
          <FilterPill
            key={r}
            label={ROLE_LABEL[r]}
            active={roleFilter === r && !pendingOnly}
            onPress={() => {
              setRoleFilter(r);
              setPendingOnly(false);
            }}
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
            onApprove={
              u.verification_status === 'PENDING'
                ? () => void handleApprove(u)
                : undefined
            }
            onReject={
              u.verification_status === 'PENDING' ? () => setRejectUser(u) : undefined
            }
            onToggleActive={() =>
              adminService
                .updateUser(u.uid, { is_active: u.is_active === false })
                .then(() => refresh())
                .catch((e) => adminActionErrorAlert(e, 'Mise à jour impossible'))
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
            Alert.alert('Enregistré', 'Profil mis à jour.');
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
              'Compte rejeté',
              result.via === 'firestore'
                ? 'Statut mis à jour (notification push si Functions déployées).'
                : 'Le joueur a été notifié du refus.'
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

const FilterPill: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({
  label,
  active,
  onPress,
}) => (
  <TouchableOpacity style={[styles.pill, active && styles.pillOn]} onPress={onPress}>
    <Text style={[styles.pillText, active && styles.pillTextOn]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fab: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  fabText: { color: colors.brandInverse, fontWeight: '900', fontSize: 14 },
  filters: { maxHeight: 44, marginBottom: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  pillOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  pillText: { fontSize: 12, fontWeight: '800', color: colors.text },
  pillTextOn: { color: colors.brandInverse },
});
