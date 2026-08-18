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
import { ADMIN_FOC_TABS } from '../../../navigation/adminFocConfig';
import { AdminFocTabs, AdminFocPageHeader } from '../../../components/admin/foc/AdminFocTabs';
import { AdminFocAccountEditor } from './AdminFocAccountEditor';
import { Icon } from '../../../components/ui/Icon';
import { adminChrome, adminType } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';
import { getRoleLabel } from '../../signup/signupFlowConfig';
import { userNeedsAdminVerificationReview } from '../../../utils/adminUserVerification';
import { isSubscriptionAccessActive } from '../../../utils/subscriptionLogic';
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
import type { JoueurAgeGroup } from '../../../utils/joueurExperienceTheme';
import {
  adminPlayerIdentityLine,
  adminUniverseShortLabel,
  resolveAdminPlayerAgeGroup,
  suggestAppSpaceForPlayer,
  type AdminEditableGender,
} from '../../../utils/adminPlayerUniverse';

const TABS = ADMIN_FOC_TABS.adherents;
type TabId = (typeof TABS)[number]['id'];

type AgeFilter = 'all' | JoueurAgeGroup;
type GenderFilter = 'all' | AdminEditableGender;

const AGE_FILTERS: { id: AgeFilter; label: string }[] = [
  { id: 'all', label: 'Tous âges' },
  { id: 'youth', label: 'Monde -13' },
  { id: 'teen', label: '13–17' },
  { id: 'adult', label: '18+' },
];

const GENDER_FILTERS: { id: GenderFilter; label: string }[] = [
  { id: 'all', label: 'H / F' },
  { id: 'men', label: 'Homme' },
  { id: 'women', label: 'Femme' },
];

function filterUsers(
  users: User[],
  tab: TabId,
  query: string,
  ageFilter: AgeFilter,
  genderFilter: GenderFilter,
): User[] {
  const q = query.trim().toLowerCase();
  let list = users;
  if (tab === 'player') list = list.filter((u) => u.role === 'player');
  else if (tab === 'parent') list = list.filter((u) => u.role === 'parent');
  else if (tab === 'coach') list = list.filter((u) => u.role === 'coach');
  else if (tab === 'club') list = list.filter((u) => u.role === 'club');
  else if (tab === 'youth') {
    list = list.filter(
      (u) => u.role === 'player' && resolveAdminPlayerAgeGroup(u) === 'youth',
    );
  } else if (tab === 'teen') {
    list = list.filter(
      (u) => u.role === 'player' && resolveAdminPlayerAgeGroup(u) === 'teen',
    );
  } else if (tab === 'adult') {
    list = list.filter(
      (u) => u.role === 'player' && resolveAdminPlayerAgeGroup(u) === 'adult',
    );
  } else if (tab === 'decisions') list = list.filter(userNeedsAdminVerificationReview);

  if (ageFilter !== 'all') {
    list = list.filter(
      (u) => u.role === 'player' && resolveAdminPlayerAgeGroup(u) === ageFilter,
    );
  }
  if (genderFilter !== 'all') {
    list = list.filter((u) => u.profile?.gender === genderFilter);
  }

  if (q) {
    list = list.filter((u) => {
      const identity = adminPlayerIdentityLine(u)?.toLowerCase() ?? '';
      return (
        u.display_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.city?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        identity.includes(q)
      );
    });
  }
  return list;
}

function UserRow({ user, onPress }: { user: User; onPress: (u: User) => void }) {
  const payant = isSubscriptionAccessActive(user);
  const pending = userNeedsAdminVerificationReview(user);
  const identity = adminPlayerIdentityLine(user);
  const ageGroup = resolveAdminPlayerAgeGroup(user);

  return (
    <Pressable
      onPress={() => onPress(user)}
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${user.display_name}`}
    >
      <View style={s.rowMain}>
        <Text style={s.rowName} numberOfLines={1}>
          {user.display_name || '—'}
        </Text>
        <Text style={s.rowSub} numberOfLines={1}>
          {getRoleLabel(user.role)}
          {user.city ? ` · ${user.city}` : ''}
          {pending ? ' · À valider' : ''}
        </Text>
        {identity ? (
          <Text style={s.rowIdentity} numberOfLines={1}>
            {identity}
          </Text>
        ) : (
          <Text style={s.rowEmail} numberOfLines={1}>
            {user.email || '—'}
          </Text>
        )}
      </View>
      <View style={s.badges}>
        {ageGroup ? (
          <View style={[s.badge, s.badgeUniverse]}>
            <Text style={[s.badgeText, s.badgeUniverseText]}>
              {adminUniverseShortLabel(ageGroup)}
            </Text>
          </View>
        ) : null}
        <View style={[s.badge, payant ? s.badgePay : s.badgeFree]}>
          <Text style={[s.badgeText, payant ? s.badgePayText : s.badgeFreeText]}>
            {payant ? 'Payant' : 'Gratuit'}
          </Text>
        </View>
      </View>
      <Icon name="chevron-forward" size={14} color={adminChrome.textMuted} />
    </Pressable>
  );
}

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

          <Pressable
            style={[s.createBtn, busy && { opacity: 0.5 }]}
            disabled={busy}
            onPress={() => void submit()}
          >
            {busy ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={s.createBtnText}>Créer le compte</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

export function AdminFocAdherentsScreen() {
  const { users, refreshing, refresh } = useAdminData();
  const [tab, setTab] = useState<TabId>('all');
  const [query, setQuery] = useState('');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('all');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(
    () => filterUsers(users, tab, query, ageFilter, genderFilter),
    [users, tab, query, ageFilter, genderFilter],
  );
  const selected = selectedUid ? users.find((u) => u.uid === selectedUid) ?? null : null;

  const handleSaved = useCallback(() => {
    void refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (selectedUid && !users.some((u) => u.uid === selectedUid)) {
      setSelectedUid(null);
    }
  }, [selectedUid, users]);

  if (selected) {
    return (
      <AdminFocAccountEditor
        user={selected}
        onBack={() => setSelectedUid(null)}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <View style={s.root}>
      <AdminFocPageHeader
        title="Adhérents"
        subtitle={`${filtered.length} profil${filtered.length !== 1 ? 's' : ''} · créer, filtrer, personnaliser`}
        right={
          <Pressable
            onPress={() => setCreateOpen(true)}
            style={s.addBtn}
            accessibilityRole="button"
            accessibilityLabel="Créer un compte"
          >
            <Icon name="add" size={18} color="#FFF" />
            <Text style={s.addBtnText}>Nouveau</Text>
          </Pressable>
        }
      />
      <AdminFocTabs tabs={TABS} value={tab} onChange={(id) => setTab(id as TabId)} />

      <View style={s.filterRow}>
        {AGE_FILTERS.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setAgeFilter(f.id)}
            style={[s.filterChip, ageFilter === f.id && s.filterChipOn]}
          >
            <Text style={[s.filterChipText, ageFilter === f.id && s.filterChipTextOn]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={s.filterRow}>
        {GENDER_FILTERS.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setGenderFilter(f.id)}
            style={[s.filterChip, genderFilter === f.id && s.filterChipOn]}
          >
            <Text style={[s.filterChipText, genderFilter === f.id && s.filterChipTextOn]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={s.searchWrap}>
        <Icon name="search" size={16} color={adminChrome.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Nom, e-mail, ville, univers…"
          placeholderTextColor={adminChrome.textMuted}
          style={s.search}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(u) => u.uid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={adminChrome.accent} />
        }
        renderItem={({ item }) => (
          <UserRow user={item} onPress={(u) => setSelectedUid(u.uid)} />
        )}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Icon name="people" size={32} color={adminChrome.textMuted} />
            <Text style={s.emptyTitle}>Aucun adhérent</Text>
            <Text style={s.emptySub}>
              {tab === 'decisions'
                ? 'Aucun profil en attente de validation.'
                : 'Aucun profil ne correspond à ce filtre.'}
            </Text>
          </View>
        }
        contentContainerStyle={filtered.length === 0 ? s.emptyContainer : s.list}
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: adminChrome.accent,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: adminChrome.radiusSm,
  },
  addBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: adminChrome.shell,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: adminChrome.radiusSm,
    backgroundColor: adminChrome.shellElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
  },
  filterChipOn: { backgroundColor: adminChrome.accent, borderColor: adminChrome.accent },
  filterChipText: { fontSize: 11, fontWeight: '700', color: adminChrome.textMuted },
  filterChipTextOn: { color: '#FFF' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderRadius: adminChrome.radius,
    backgroundColor: adminChrome.shell,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
  },
  search: { flex: 1, fontSize: 14, color: adminChrome.text, padding: 0 },
  list: { paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: adminChrome.shell,
  },
  rowPressed: { backgroundColor: adminChrome.rowHover },
  rowMain: { flex: 1, minWidth: 0, gap: 2 },
  rowName: { fontSize: 15, fontWeight: '800', color: adminChrome.text, letterSpacing: -0.2 },
  rowSub: { fontSize: 12, color: adminChrome.textMuted, fontWeight: '600' },
  rowIdentity: { fontSize: 12, color: adminChrome.accent, fontWeight: '700' },
  rowEmail: { fontSize: 12, color: adminChrome.textMuted },
  badges: { alignItems: 'flex-end', gap: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: adminChrome.radiusSm,
  },
  badgePay: { backgroundColor: adminChrome.soft },
  badgeFree: { backgroundColor: adminChrome.shellElevated },
  badgeUniverse: { backgroundColor: adminChrome.pitchSoft },
  badgeText: { fontSize: 10, fontWeight: '800' },
  badgePayText: { color: adminChrome.accent },
  badgeFreeText: { color: adminChrome.textMuted },
  badgeUniverseText: { color: adminChrome.pitch },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: adminChrome.shellBorder },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: adminChrome.text },
  emptySub: { fontSize: 13, color: adminChrome.textMuted, textAlign: 'center' },
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
  createBtn: {
    marginTop: spacing.md,
    backgroundColor: adminChrome.accent,
    borderRadius: adminChrome.radius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
});
