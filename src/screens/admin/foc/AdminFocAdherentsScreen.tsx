import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  RefreshControl,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useAdminData } from '../../../context/AdminDataContext';
import { useAuth } from '../../../context/AuthContext';
import { AdminFocPageHeader } from '../../../components/admin/foc/AdminFocTabs';
import { AdminPersonRow } from '../../../components/admin/foc/AdminPersonRow';
import { AdminPersonFiltersSheet } from '../../../components/admin/foc/AdminPersonFiltersSheet';
import { AdminFilterChips } from '../../../components/admin/AdminFilterChips';
import { AdminEmptyState } from '../../../components/admin/AdminEmptyState';
import { AdminButton } from '../../../components/admin/AdminButton';
import { AdminFocAccountEditor } from './AdminFocAccountEditor';
import { Icon } from '../../../components/ui/Icon';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';
import { getRoleLabel } from '../../signup/signupFlowConfig';
import type { User, UserRole } from '../../../models/User';
import type { ProductLineId } from '../../../models/ProductLine';
import { adminService } from '../../../services/admin.service';
import { adminAuditService } from '../../../services/adminAudit.service';
import {
  ADMIN_PRODUCT_LINES,
  adminProductLineLabel,
  adminRolesForProductLine,
  resolveAdminProductLine,
} from '../../../utils/adminProductLine';
import { defaultRoleForProductLine } from '../../../content/universeRoles';
import { isJoueurProductLine } from '../../../utils/playerLevelBadge';
import { BirthDateFields } from '../../../components/player/BirthDateFields';
import {
  JOUEUR_UNIVERSE_LABELS,
  isValidPlayerBirthDate,
  toBirthDateIso,
} from '../../../utils/joueurBirthAge';
import {
  suggestAppSpaceForPlayer,
  type AdminEditableGender,
} from '../../../utils/adminPlayerUniverse';
import {
  ADMIN_PERSON_PRIMARY_TABS,
  adminPersonAdvancedFiltersActive,
  adminPersonShowPlayerFilters,
  countAdminPersonPending,
  filterAdminPersons,
  resolveAdminPersonInitialTab,
  type AdminPersonAgeFilter,
  type AdminPersonGenderFilter,
  type AdminPersonSubscriptionFilter,
  type AdminPersonTabId,
} from '../../../utils/adminPersonFilters';

type CreateForm = {
  email: string;
  password: string;
  display_name: string;
  city: string;
  role: UserRole;
  product_line: ProductLineId;
  gender: AdminEditableGender | null;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  autoSpace: boolean;
};

const EMPTY_CREATE: CreateForm = {
  email: '',
  password: '',
  display_name: '',
  city: '',
  role: 'player',
  product_line: 'amateur',
  gender: 'men',
  birthDay: '',
  birthMonth: '',
  birthYear: '',
  autoSpace: true,
};

function CreateUserModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (uid: string) => void;
}) {
  const { profile, firebaseUser } = useAuth();
  const [form, setForm] = useState<CreateForm>(EMPTY_CREATE);
  const [busy, setBusy] = useState(false);

  const metierRoles = adminRolesForProductLine(
    isJoueurProductLine(form.product_line) ? 'amateur' : form.product_line,
  );

  const birthIso = useMemo(() => {
    const d = Number(form.birthDay);
    const m = Number(form.birthMonth);
    const y = Number(form.birthYear);
    if (!d || !m || !y) return null;
    return toBirthDateIso(y, m, d);
  }, [form.birthDay, form.birthMonth, form.birthYear]);

  const birthValidation = useMemo(() => {
    if (!birthIso) return null;
    return isValidPlayerBirthDate(birthIso);
  }, [birthIso]);

  const patch = (p: Partial<CreateForm>) => setForm((prev) => ({ ...prev, ...p }));

  const submit = async () => {
    if (!form.email.trim() || form.password.length < 6 || !form.display_name.trim()) {
      Alert.alert('Nouveau compte', 'Email, mot de passe (≥ 6) et nom sont requis.');
      return;
    }
    if (form.role === 'player' && (form.birthDay || form.birthMonth || form.birthYear)) {
      if (!birthValidation || !birthValidation.ok) {
        Alert.alert(
          'Date de naissance',
          birthValidation && !birthValidation.ok
            ? birthValidation.reason
            : 'Date invalide.',
        );
        return;
      }
    }
    setBusy(true);
    try {
      const ageGroup =
        birthValidation && birthValidation.ok ? birthValidation.ageGroup : null;
      const app_space =
        form.role === 'player' && form.autoSpace && form.gender && ageGroup
          ? suggestAppSpaceForPlayer(form.gender, ageGroup)
          : undefined;

      const res = await adminService.createUser({
        email: form.email.trim(),
        password: form.password,
        display_name: form.display_name.trim(),
        city: form.city.trim() || undefined,
        role: form.role,
        product_line: form.product_line,
        gender: form.role === 'player' ? form.gender ?? undefined : undefined,
        birth_date:
          form.role === 'player' && birthValidation && birthValidation.ok
            ? birthIso!
            : undefined,
        age:
          form.role === 'player' && birthValidation && birthValidation.ok
            ? birthValidation.age
            : undefined,
        app_space,
      });
      await adminAuditService.log({
        action: 'user_created',
        actor_uid: profile?.uid ?? '',
        actor_email: firebaseUser?.email ?? profile?.email,
        target_type: 'user',
        target_id: res.uid,
        summary: `Compte créé · ${form.role}${
          ageGroup ? ` · ${JOUEUR_UNIVERSE_LABELS[ageGroup].title}` : ''
        }`,
      });
      setForm(EMPTY_CREATE);
      onCreated(res.uid);
      onClose();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.modalRoot}>
        <View style={s.modalHead}>
          <Text style={s.modalTitle}>Nouveau compte</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Icon name="close" size={22} color={adminChrome.textMuted} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={s.modalBody}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.fieldLabel}>Email</Text>
          <TextInput
            style={s.input}
            value={form.email}
            onChangeText={(email) => patch({ email })}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={adminChrome.textMuted}
          />
          <Text style={s.fieldLabel}>Mot de passe</Text>
          <TextInput
            style={s.input}
            value={form.password}
            onChangeText={(password) => patch({ password })}
            secureTextEntry
            placeholderTextColor={adminChrome.textMuted}
          />
          <Text style={s.fieldLabel}>Nom affiché</Text>
          <TextInput
            style={s.input}
            value={form.display_name}
            onChangeText={(display_name) => patch({ display_name })}
            placeholderTextColor={adminChrome.textMuted}
          />
          <Text style={s.fieldLabel}>Ville</Text>
          <TextInput
            style={s.input}
            value={form.city}
            onChangeText={(city) => patch({ city })}
            placeholderTextColor={adminChrome.textMuted}
          />

          <Text style={s.fieldLabel}>Univers produit</Text>
          <View style={s.chipRow}>
            {ADMIN_PRODUCT_LINES.map((line) => {
              const active = isJoueurProductLine(line)
                ? isJoueurProductLine(form.product_line)
                : form.product_line === line;
              return (
                <Pressable
                  key={line}
                  onPress={() => {
                    const allowed = adminRolesForProductLine(line);
                    const role = allowed.includes(form.role)
                      ? form.role
                      : defaultRoleForProductLine(line);
                    patch({
                      product_line: resolveAdminProductLine(role, line),
                      role,
                    });
                  }}
                  style={[s.chip, active && s.chipOn]}
                >
                  <Text style={[s.chipText, active && s.chipTextOn]}>
                    {adminProductLineLabel(line)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={s.fieldLabel}>Rôle</Text>
          <View style={s.chipRow}>
            {metierRoles.map((r) => {
              const on = form.role === r;
              return (
                <Pressable
                  key={r}
                  onPress={() =>
                    patch({
                      role: r,
                      product_line: resolveAdminProductLine(r, form.product_line),
                    })
                  }
                  style={[s.chip, on && s.chipOn]}
                >
                  <Text style={[s.chipText, on && s.chipTextOn]}>{getRoleLabel(r)}</Text>
                </Pressable>
              );
            })}
          </View>

          {form.role === 'player' ? (
            <>
              <Text style={s.fieldLabel}>Genre</Text>
              <View style={s.chipRow}>
                {(
                  [
                    { id: 'men' as const, label: 'Homme / Joueur' },
                    { id: 'women' as const, label: 'Femme / Joueuse' },
                  ] as const
                ).map((g) => (
                  <Pressable
                    key={g.id}
                    onPress={() => patch({ gender: g.id })}
                    style={[s.chip, form.gender === g.id && s.chipOn]}
                  >
                    <Text style={[s.chipText, form.gender === g.id && s.chipTextOn]}>
                      {g.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <BirthDateFields
                day={form.birthDay}
                month={form.birthMonth}
                year={form.birthYear}
                onDay={(birthDay) => patch({ birthDay })}
                onMonth={(birthMonth) => patch({ birthMonth })}
                onYear={(birthYear) => patch({ birthYear })}
                accent={adminChrome.accent}
                variant="light"
                label="Date de naissance"
                hint="Définit Monde -13, 13–17 ou 18+."
                error={
                  birthValidation && !birthValidation.ok ? birthValidation.reason : null
                }
              />

              {birthValidation && birthValidation.ok ? (
                <View style={s.previewCard}>
                  <Text style={s.previewTitle}>
                    {JOUEUR_UNIVERSE_LABELS[birthValidation.ageGroup].title}
                  </Text>
                  <Text style={s.previewSub}>
                    {birthValidation.age} ans ·{' '}
                    {JOUEUR_UNIVERSE_LABELS[birthValidation.ageGroup].range}
                  </Text>
                </View>
              ) : null}

              <View style={s.switchRow}>
                <Text style={s.switchLabel}>Communauté auto (AppSpace)</Text>
                <Switch
                  value={form.autoSpace}
                  onValueChange={(autoSpace) => patch({ autoSpace })}
                  trackColor={{ false: adminChrome.shellBorder, true: adminChrome.soft }}
                  thumbColor={form.autoSpace ? adminChrome.accent : '#FFF'}
                />
              </View>
            </>
          ) : null}

          <AdminButton
            label="Créer le compte"
            variant="primary"
            loading={busy}
            disabled={busy}
            onPress={() => void submit()}
            style={s.createBtnWrap}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

function emptyMessage(tab: AdminPersonTabId, query: string, filtersActive: boolean) {
  if (query.trim()) {
    return {
      title: 'Aucun résultat',
      subtitle: 'Essayez un autre nom, e-mail ou ville.',
    };
  }
  if (tab === 'decisions') {
    return {
      title: 'Rien à valider',
      subtitle: 'Tous les profils en attente ont été traités.',
    };
  }
  if (filtersActive) {
    return {
      title: 'Aucun profil',
      subtitle: 'Ajustez les filtres avancés pour élargir la liste.',
    };
  }
  return {
    title: 'Aucun profil',
    subtitle: 'Créez un compte ou changez de filtre.',
  };
}

function findAdherentByUid(users: User[], uid: string | null): User | null {
  if (!uid) return null;
  return (
    users.find((u) => u.uid === uid) ??
    users.find((u) => String((u as { id?: string }).id ?? '') === uid) ??
    null
  );
}

export function AdminFocAdherentsScreen({
  initialTab,
  initialUserId,
}: { initialTab?: string; initialUserId?: string } = {}) {
  const { users, refreshing, refresh } = useAdminData();
  const initial = useMemo(() => resolveAdminPersonInitialTab(initialTab), [initialTab]);
  const [tab, setTab] = useState<AdminPersonTabId>(initial.tab);
  const [query, setQuery] = useState('');
  const [ageFilter, setAgeFilter] = useState<AdminPersonAgeFilter>(initial.ageFilter);
  const [genderFilter, setGenderFilter] = useState<AdminPersonGenderFilter>('all');
  const [subscriptionFilter, setSubscriptionFilter] =
    useState<AdminPersonSubscriptionFilter>('all');
  const [selectedUid, setSelectedUid] = useState<string | null>(initialUserId ?? null);
  const [selectedOverride, setSelectedOverride] = useState<User | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const pendingCount = useMemo(() => countAdminPersonPending(users), [users]);
  const primaryTabs = useMemo(() => {
    const tabs = ADMIN_PERSON_PRIMARY_TABS.map((t) =>
      t.id === 'decisions' ? { ...t, count: pendingCount } : t,
    );
    if (tab === 'decisions' && !tabs.some((t) => t.id === 'decisions')) {
      tabs.splice(1, 0, { id: 'decisions' as const, label: 'À valider', count: pendingCount });
    }
    if (tab === 'club' && !tabs.some((t) => t.id === 'club')) {
      tabs.push({ id: 'club', label: 'Dirigeants' });
    }
    return tabs;
  }, [pendingCount, tab]);

  const filtersActive = adminPersonAdvancedFiltersActive(
    ageFilter,
    genderFilter,
    subscriptionFilter,
  );
  const showPlayerFilters = adminPersonShowPlayerFilters(tab);

  const filtered = useMemo(
    () =>
      filterAdminPersons(
        users,
        tab,
        query,
        ageFilter,
        genderFilter,
        subscriptionFilter,
      ),
    [users, tab, query, ageFilter, genderFilter, subscriptionFilter],
  );
  const selectedFromList = findAdherentByUid(users, selectedUid);
  const selected = useMemo(() => {
    if (!selectedUid) return null;
    if (selectedOverride?.uid === selectedUid) {
      if (
        selectedFromList &&
        selectedFromList.verification_status === selectedOverride.verification_status &&
        selectedFromList.is_verified === selectedOverride.is_verified
      ) {
        return selectedFromList;
      }
      return selectedOverride;
    }
    return selectedFromList;
  }, [selectedUid, selectedFromList, selectedOverride]);

  const handleSaved = useCallback(async () => {
    await refresh();
    if (!selectedUid) return;
    const fresh = await adminService.getUser(selectedUid);
    if (fresh) setSelectedOverride(fresh);
  }, [refresh, selectedUid]);

  const resetAdvancedFilters = useCallback(() => {
    setAgeFilter('all');
    setGenderFilter('all');
    setSubscriptionFilter('all');
  }, []);

  React.useEffect(() => {
    const resolved = resolveAdminPersonInitialTab(initialTab);
    setTab(resolved.tab);
    setAgeFilter(resolved.ageFilter);
  }, [initialTab]);

  React.useEffect(() => {
    if (initialUserId) setSelectedUid(initialUserId);
  }, [initialUserId]);

  React.useEffect(() => {
    setSelectedOverride(null);
  }, [selectedUid]);

  React.useEffect(() => {
    if (refreshing) return;
    if (selectedUid && users.length > 0 && !findAdherentByUid(users, selectedUid) && !selectedOverride) {
      setSelectedUid(null);
    }
  }, [selectedUid, users, refreshing, selectedOverride]);

  if (selected) {
    return (
      <AdminFocAccountEditor
        user={selected}
        onBack={() => setSelectedUid(null)}
        onSaved={handleSaved}
      />
    );
  }

  const empty = emptyMessage(tab, query, filtersActive);

  return (
    <View style={s.root}>
      <AdminFocPageHeader
        title="Personnes"
        subtitle={`${filtered.length} profil${filtered.length !== 1 ? 's' : ''} · créer, filtrer, gérer`}
        right={
          <AdminButton
            label="Nouveau"
            icon="add"
            variant="primary"
            size="sm"
            onPress={() => setCreateOpen(true)}
            accessibilityLabel="Créer un compte"
          />
        }
      />

      <View style={s.searchBlock}>
        <View style={s.searchWrap}>
          <Icon name="search" size={16} color={adminChrome.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Nom, e-mail, ville, rôle…"
            placeholderTextColor={adminChrome.textMuted}
            style={s.search}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          <Pressable
            onPress={() => setFiltersOpen(true)}
            style={[s.filterBtn, filtersActive && s.filterBtnActive]}
            accessibilityLabel="Filtres avancés"
          >
            <Icon
              name="tune"
              size={18}
              color={filtersActive ? '#FFF' : adminChrome.textMuted}
            />
          </Pressable>
        </View>
      </View>

      <View style={s.chipsWrap}>
        <AdminFilterChips
          options={primaryTabs}
          value={tab}
          onChange={(id) => setTab(id)}
          compact
        />
      </View>

      {filtersActive ? (
        <View style={s.refineBanner}>
          <Pressable style={s.refinePress} onPress={() => setFiltersOpen(true)}>
            <Text style={s.refineText} numberOfLines={1}>
              Filtres actifs · Affiner
            </Text>
          </Pressable>
          <Pressable onPress={resetAdvancedFilters} hitSlop={8} accessibilityLabel="Effacer les filtres">
            <Icon name="close" size={14} color={adminChrome.accent} />
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(u) => u.uid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={adminChrome.accent} />
        }
        renderItem={({ item }) => (
          <AdminPersonRow user={item} onPress={(u) => setSelectedUid(u.uid)} />
        )}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <AdminEmptyState icon="people" title={empty.title} subtitle={empty.subtitle} />
          </View>
        }
        contentContainerStyle={filtered.length === 0 ? s.emptyContainer : s.list}
      />

      <AdminPersonFiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        showPlayerFilters={showPlayerFilters}
        ageFilter={ageFilter}
        genderFilter={genderFilter}
        subscriptionFilter={subscriptionFilter}
        onAgeChange={setAgeFilter}
        onGenderChange={setGenderFilter}
        onSubscriptionChange={setSubscriptionFilter}
        onReset={resetAdvancedFilters}
      />

      <CreateUserModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(uid) => {
          void refresh().then(() => setSelectedUid(uid));
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminChrome.band },
  searchBlock: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: adminChrome.shell,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: adminChrome.radius,
    backgroundColor: adminChrome.shellElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
  },
  search: { flex: 1, fontSize: 15, color: adminChrome.text, padding: 0, fontWeight: '600' },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: adminChrome.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminChrome.shell,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
  },
  filterBtnActive: {
    backgroundColor: adminChrome.accent,
    borderColor: adminChrome.accent,
  },
  chipsWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: adminChrome.shell,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminChrome.shellBorder,
  },
  refineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: adminChrome.radiusSm,
    backgroundColor: adminChrome.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.accentMuted,
  },
  refinePress: { flex: 1, minWidth: 0 },
  refineText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: adminChrome.accent,
  },
  list: { paddingBottom: spacing.xl },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: adminChrome.shellBorder },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', padding: spacing.md },
  emptyWrap: { marginHorizontal: spacing.sm },
  modalRoot: { flex: 1, backgroundColor: adminChrome.band },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: adminChrome.shell,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminChrome.shellBorder,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: adminChrome.text, letterSpacing: -0.3 },
  modalBody: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl * 2 },
  fieldLabel: {
    marginTop: spacing.sm,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: adminChrome.textMuted,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
    backgroundColor: adminChrome.shell,
    borderRadius: adminChrome.radius,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: adminChrome.text,
    fontSize: 15,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: adminChrome.radiusSm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
    backgroundColor: adminChrome.shell,
  },
  chipOn: { backgroundColor: adminChrome.accent, borderColor: adminChrome.accent },
  chipText: { fontSize: 12, fontWeight: '700', color: adminChrome.textMuted },
  chipTextOn: { color: '#FFF' },
  previewCard: {
    padding: spacing.md,
    borderRadius: adminChrome.radius,
    backgroundColor: adminChrome.pitchSoft,
    gap: 2,
  },
  previewTitle: { fontSize: 15, fontWeight: '800', color: adminChrome.pitch },
  previewSub: { fontSize: 12, color: adminChrome.textMuted, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: adminChrome.text },
  createBtnWrap: { marginTop: spacing.md },
});
