import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useAdminData } from '../data/AdminDataContext';
import {
  AdminBadge,
  AdminCard,
  AdminEmptyState,
  AdminLoading,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';
import { getRoleLabel } from '../../../screens/signup/signupFlowConfig';
import { userNeedsAdminVerificationReview } from '../../../utils/adminUserVerification';
import type { UserRole } from '../../../models/User';

const ROLE_FILTERS: { id: 'all' | UserRole; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'player', label: 'Joueurs' },
  { id: 'coach', label: 'Coachs' },
  { id: 'parent', label: 'Parents' },
  { id: 'club', label: 'Clubs' },
  { id: 'supporter', label: 'Supporters' },
  { id: 'sponsor', label: 'Sponsors' },
];

export function AdminUsersPane({ focusId }: { focusId?: string }) {
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  const [q, setQ] = useState('');
  const [role, setRole] = useState<'all' | UserRole>('all');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return data.users
      .filter((u) => {
        if (focusId && u.uid === focusId) return true;
        if (role !== 'all' && u.role !== role) return false;
        if (focusId && !query) return u.uid === focusId;
        if (!query) return true;
        return (
          u.display_name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          (u.city?.toLowerCase().includes(query) ?? false)
        );
      })
      .slice(0, focusId && !query ? 1 : 200);
  }, [data.users, q, role, focusId]);

  if (data.loading) return <AdminLoading />;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminText variant="h1">Utilisateurs</AdminText>
        <AdminText variant="caption" color={t.muted}>
          {data.users.length} comptes · recherche globale
        </AdminText>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Nom, e-mail, ville…"
          placeholderTextColor={t.faint}
          style={[
            styles.input,
            { color: t.foreground, borderColor: t.border, backgroundColor: t.surface },
          ]}
        />
        <View style={styles.chips}>
          {ROLE_FILTERS.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => setRole(f.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: role === f.id ? t.accentSoft : t.surfaceRaised,
                  borderColor: role === f.id ? t.accent : t.border,
                },
              ]}
            >
              <AdminText variant="caption" color={role === f.id ? t.accentHot : t.muted}>
                {f.label}
              </AdminText>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={{ padding: adminSpace.lg, gap: 8 }}
        ListEmptyComponent={
          <AdminEmptyState title="Aucun utilisateur" body="Ajustez les filtres ou la recherche." />
        }
        renderItem={({ item }) => {
          const needs = userNeedsAdminVerificationReview(item);
          return (
            <AdminCard>
              <View style={styles.row}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AdminText variant="h3">{item.display_name}</AdminText>
                  <AdminText variant="caption" color={t.muted}>
                    {getRoleLabel(item.role)} · {item.email}
                  </AdminText>
                  {item.city ? (
                    <AdminText variant="caption" color={t.faint}>
                      {item.city}
                    </AdminText>
                  ) : null}
                </View>
                <View style={{ gap: 4, alignItems: 'flex-end' }}>
                  {needs ? <AdminBadge label="À vérifier" tone="warn" /> : null}
                  <AdminBadge
                    label={
                      item.subscription_tier && item.subscription_tier !== 'free'
                        ? 'Payant'
                        : 'Gratuit'
                    }
                    tone={
                      item.subscription_tier && item.subscription_tier !== 'free'
                        ? 'accent'
                        : 'info'
                    }
                  />
                </View>
              </View>
            </AdminCard>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    padding: adminSpace.lg,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ADMIN_TOKENS.hairline,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
});
