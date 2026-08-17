import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { User, UserRole, VerificationStatus } from '../../../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../../../models/User';
import type { ProductLineId } from '../../../models/ProductLine';
import type { PlayerLevelId } from '../../../models/PlayerLevel';
import { PLAYER_LEVEL_BADGES } from '../../../models/PlayerLevel';
import {
  APP_SPACE_IDS,
  APP_SPACE_LABELS,
  type AppSpaceId,
} from '../../../models/AppSpace';
import {
  ADMIN_PRODUCT_LINES,
  adminProductLineLabel,
  adminRolesForProductLine,
  resolveAdminProductLine,
} from '../../../utils/adminProductLine';
import { getUserProductLine } from '../../../utils/productLineAccess';
import { defaultRoleForProductLine } from '../../../content/universeRoles';
import { getRoleLabel } from '../../signup/signupFlowConfig';
import { isJoueurProductLine } from '../../../utils/playerLevelBadge';
import {
  SUBSCRIPTION_PLANS,
  planIdForRole,
  ROLES_WITHOUT_STORE_PLAN,
  type SubscriptionPlanId,
} from '../../../content/subscriptionPlans';
import { isSubscriptionAccessActive } from '../../../utils/subscriptionLogic';
import { adminService, type AdminUserDocument } from '../../../services/admin.service';
import { adminAuditService } from '../../../services/adminAudit.service';
import { useAuth } from '../../../context/AuthContext';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';
import { Icon } from '../../../components/ui/Icon';
import { BirthDateFields } from '../../../components/player/BirthDateFields';
import { userNeedsAdminVerificationReview } from '../../../utils/adminUserVerification';
import {
  JOUEUR_UNIVERSE_LABELS,
  birthDateIsoForAgeGroup,
  isValidPlayerBirthDate,
  parseBirthDateIso,
  toBirthDateIso,
  type BirthDateIso,
} from '../../../utils/joueurBirthAge';
import type { JoueurAgeGroup } from '../../../utils/joueurExperienceTheme';
import {
  adminAppSpaceLabel,
  adminUniverseRangeLabel,
  editableGenderFromProfile,
  suggestAppSpaceForPlayer,
  type AdminEditableGender,
} from '../../../utils/adminPlayerUniverse';
import { adminGenderLabel } from '../../../utils/adminUserDisplay';

const VERIFY: { id: VerificationStatus; label: string }[] = [
  { id: 'NOT_REQUIRED', label: 'Non requise' },
  { id: 'PENDING', label: 'En attente' },
  { id: 'VERIFIED', label: 'Vérifié' },
  { id: 'REJECTED', label: 'Refusé' },
];

const SPONSOR_TIERS: { id: 'starter' | 'territorial' | 'national'; label: string }[] = [
  { id: 'starter', label: 'Starter' },
  { id: 'territorial', label: 'Territorial' },
  { id: 'national', label: 'National' },
];

const PLAYER_LEVELS: PlayerLevelId[] = ['amateur', 'academy', 'professional'];

const POSITIONS = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant'];

const GENDERS: { id: AdminEditableGender; label: string }[] = [
  { id: 'men', label: 'Homme / Joueur' },
  { id: 'women', label: 'Femme / Joueuse' },
];

const STRONG_FEET: { id: 'left' | 'right' | 'both'; label: string }[] = [
  { id: 'left', label: 'Gauche' },
  { id: 'right', label: 'Droit' },
  { id: 'both', label: 'Ambidextre' },
];

const DOC_CHECK_LABEL: Record<string, string> = {
  identity: 'Identité',
  club_license: 'Licence club',
  parental_consent: 'Autorisation parentale',
};

function birthPartsFromIso(iso?: string | null): { day: string; month: string; year: string } {
  const d = parseBirthDateIso(iso ?? undefined);
  if (!d) return { day: '', month: '', year: '' };
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: String(d.getMonth() + 1).padStart(2, '0'),
    year: String(d.getFullYear()),
  };
}

function aiStatusLabel(status?: string): string {
  if (status === 'approved') return 'IA · validé';
  if (status === 'rejected') return 'IA · refusé';
  if (status === 'manual_review') return 'IA · revue manuelle';
  if (status) return `IA · ${status}`;
  return 'Pas encore analysé';
}

type EditorTab = 'profil' | 'univers' | 'famille' | 'role' | 'offre' | 'docs' | 'actions';

type Props = {
  user: User;
  onBack: () => void;
  onSaved: () => void;
};

/**
 * Page FOC — fiche adhérent (profil, rôle, offre, documents, actions).
 * S’affiche dans le shell, pas en modale.
 */
export function AdminFocAccountEditor({ user, onBack, onSaved }: Props) {
  const { profile, firebaseUser } = useAuth();
  const styles = useMemo(() => createStyles(), []);

  const [tab, setTab] = useState<EditorTab>(
    userNeedsAdminVerificationReview(user) ? 'docs' : 'profil',
  );
  const [busy, setBusy] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const [documents, setDocuments] = useState<AdminUserDocument[]>([]);

  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<UserRole>('player');
  const [productLine, setProductLine] = useState<ProductLineId>('amateur');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('NOT_REQUIRED');
  const [sponsorApproved, setSponsorApproved] = useState(false);
  const [sponsorTier, setSponsorTier] = useState<'starter' | 'territorial' | 'national' | null>(
    null,
  );
  const [playerLevel, setPlayerLevel] = useState<PlayerLevelId>('amateur');
  const [position, setPosition] = useState('');
  const [level, setLevel] = useState('');
  const [gender, setGender] = useState<AdminEditableGender | null>(null);
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [appSpace, setAppSpace] = useState<AppSpaceId | null>(null);
  const [category, setCategory] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [bio, setBio] = useState('');
  const [strongFoot, setStrongFoot] = useState<'left' | 'right' | 'both' | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [grantMonths, setGrantMonths] = useState(1);
  const [pickedPlan, setPickedPlan] = useState<SubscriptionPlanId | null>(null);
  const [linkedChildren, setLinkedChildren] = useState<User[]>([]);
  const [linkChildQuery, setLinkChildQuery] = useState('');
  const [parentOfDraft, setParentOfDraft] = useState<string[]>([]);

  useEffect(() => {
    setTab(userNeedsAdminVerificationReview(user) ? 'docs' : 'profil');
    setDisplayName(user.display_name ?? '');
    setCity(user.city ?? '');
    setJobTitle(user.profile?.job_title ?? '');
    setRole(user.role);
    setProductLine(getUserProductLine(user));
    setVerificationStatus(user.verification_status ?? 'NOT_REQUIRED');
    setSponsorApproved(user.sponsor_approved === true);
    setSponsorTier(user.sponsor_tier ?? null);
    setPlayerLevel(user.player_level ?? 'amateur');
    setPosition(user.profile?.position ?? '');
    setLevel(user.profile?.level ?? '');
    setGender(editableGenderFromProfile(user.profile?.gender));
    const parts = birthPartsFromIso(user.profile?.birth_date);
    setBirthDay(parts.day);
    setBirthMonth(parts.month);
    setBirthYear(parts.year);
    setAppSpace((user.app_space as AppSpaceId | undefined) ?? null);
    setCategory(user.profile?.category ?? '');
    setJerseyNumber(
      user.profile?.jersey_number != null ? String(user.profile.jersey_number) : '',
    );
    setBio(user.profile?.bio ?? '');
    setStrongFoot(user.profile?.strong_foot ?? null);
    setIsActive(user.is_active !== false);
    setParentOfDraft([...(user.parent_of ?? [])]);
    setLinkChildQuery('');
    const def = planIdForRole(user.role);
    const current = user.subscription_plan_id as SubscriptionPlanId | undefined;
    setPickedPlan(current && SUBSCRIPTION_PLANS[current] ? current : def);
    setGrantMonths(1);
  }, [user.uid]);

  useEffect(() => {
    let cancelled = false;
    if (role !== 'parent' || parentOfDraft.length === 0) {
      setLinkedChildren([]);
      return;
    }
    void Promise.all(parentOfDraft.map((uid) => adminService.getUser(uid))).then((rows) => {
      if (cancelled) return;
      setLinkedChildren(rows.filter((u): u is User => u != null));
    });
    return () => {
      cancelled = true;
    };
  }, [role, parentOfDraft.join('|')]);

  useEffect(() => {
    let cancelled = false;
    setDocsLoading(true);
    void adminService
      .listUserDocuments(user.uid)
      .then((rows) => {
        if (!cancelled) setDocuments(rows);
      })
      .catch(() => {
        if (!cancelled) setDocuments([]);
      })
      .finally(() => {
        if (!cancelled) setDocsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user.uid]);

  const metierRoles = adminRolesForProductLine(
    isJoueurProductLine(productLine) ? 'amateur' : productLine,
  );
  const rolePlans = Object.values(SUBSCRIPTION_PLANS).filter((p) => p.role === role);
  const noStore = ROLES_WITHOUT_STORE_PLAN.includes(role);
  const payant = user ? isSubscriptionAccessActive(user) : false;
  const needsVerify =
    role === 'player' ||
    role === 'sponsor' ||
    ROLES_REQUIRING_VERIFICATION.includes(role);

  const birthIsoPreview = useMemo((): BirthDateIso | null => {
    const d = Number(birthDay);
    const m = Number(birthMonth);
    const y = Number(birthYear);
    if (!d || !m || !y) return null;
    return toBirthDateIso(y, m, d);
  }, [birthDay, birthMonth, birthYear]);

  const birthValidation = useMemo(() => {
    if (!birthIsoPreview) {
      if (!birthDay && !birthMonth && !birthYear) return null;
      return { ok: false as const, reason: 'Date incomplète ou invalide.' };
    }
    return isValidPlayerBirthDate(birthIsoPreview);
  }, [birthIsoPreview, birthDay, birthMonth, birthYear]);

  const previewAgeGroup: JoueurAgeGroup | null =
    birthValidation && birthValidation.ok ? birthValidation.ageGroup : null;

  const suggestedSpace =
    role === 'player' && gender && previewAgeGroup
      ? suggestAppSpaceForPlayer(gender, previewAgeGroup)
      : null;

  const applyRole = (next: UserRole) => {
    setRole(next);
    setProductLine(resolveAdminProductLine(next, productLine));
    if (next !== 'sponsor') {
      setSponsorApproved(false);
      setSponsorTier(null);
    }
    setPickedPlan(planIdForRole(next));
  };

  const applyProductLine = (line: ProductLineId) => {
    const allowed = adminRolesForProductLine(isJoueurProductLine(line) ? 'amateur' : line);
    const nextRole = allowed.includes(role) ? role : defaultRoleForProductLine(line);
    setRole(nextRole);
    setProductLine(resolveAdminProductLine(nextRole, line));
    setPickedPlan(planIdForRole(nextRole));
  };

  const run = async (fn: () => Promise<unknown>, summary: string) => {
    if (!user) return;
    setBusy(true);
    try {
      await fn();
      await adminAuditService.log({
        action: 'user_updated',
        actor_uid: profile?.uid ?? '',
        actor_email: firebaseUser?.email ?? profile?.email,
        target_type: 'user',
        target_id: user.uid,
        summary,
      });
      onSaved();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible');
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = () => {
    if (!user) return;
    const roleChanged = role !== user.role;
    const jersey =
      jerseyNumber.trim() === ''
        ? null
        : Number.isFinite(Number(jerseyNumber))
          ? Math.floor(Number(jerseyNumber))
          : null;

    void run(
      async () => {
        await adminService.updateUser(user.uid, {
          display_name: displayName.trim() || user.display_name,
          city: city.trim(),
          role,
          product_line: productLine,
          verification_status: verificationStatus,
          is_verified: verificationStatus === 'VERIFIED',
          is_active: isActive,
          sponsor_approved: role === 'sponsor' ? sponsorApproved : false,
          sponsor_tier: role === 'sponsor' ? sponsorTier : null,
          job_title: jobTitle.trim(),
          player_level: role === 'player' ? playerLevel : null,
          position: role === 'player' ? position.trim() || null : null,
          level: role === 'player' ? level.trim() || null : null,
          ...(role === 'player'
            ? {
                category: category.trim() || null,
                jersey_number: jersey,
              }
            : {}),
        });
      },
      roleChanged
        ? `Profil modifié · rôle ${user.role} → ${role}`
        : 'Profil modifié',
    );
  };

  const saveUnivers = () => {
    if (!user || role !== 'player') return;
    if (birthDay || birthMonth || birthYear) {
      if (!birthValidation || !birthValidation.ok) {
        Alert.alert(
          'Date de naissance',
          birthValidation && !birthValidation.ok
            ? birthValidation.reason
            : 'Date de naissance invalide.',
        );
        return;
      }
    }
    void run(
      async () => {
        await adminService.updateUser(user.uid, {
          gender,
          birth_date:
            birthValidation && birthValidation.ok ? birthIsoPreview : null,
          age: birthValidation && birthValidation.ok ? birthValidation.age : null,
          app_space: appSpace,
          category: category.trim() || null,
          jersey_number:
            jerseyNumber.trim() === ''
              ? null
              : Number.isFinite(Number(jerseyNumber))
                ? Math.floor(Number(jerseyNumber))
                : null,
          bio: bio.trim() || null,
          strong_foot: strongFoot,
          position: position.trim() || null,
          level: level.trim() || null,
          player_level: playerLevel,
        });
      },
      previewAgeGroup
        ? `Univers joueur · ${JOUEUR_UNIVERSE_LABELS[previewAgeGroup].title} · ${adminGenderLabel(gender)}`
        : `Univers joueur · ${adminGenderLabel(gender)}`,
    );
  };

  /** Bascule cockpit -13 / ado / 18+ en un tap (ajuste la date de naissance). */
  const applyAgeUniverse = (id: JoueurAgeGroup) => {
    const iso = birthDateIsoForAgeGroup(id, {
      month: Number(birthMonth) || undefined,
      day: Number(birthDay) || undefined,
    });
    const parts = birthPartsFromIso(iso);
    setBirthDay(parts.day);
    setBirthMonth(parts.month);
    setBirthYear(parts.year);
    const g = gender ?? 'men';
    setAppSpace(suggestAppSpaceForPlayer(g, id));
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={styles.backBtn}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Retour aux adhérents"
        >
          <Icon name="arrow-back" size={20} color={adminChrome.accent} />
          <Text style={styles.backLabel}>Adhérents</Text>
        </Pressable>
        <Text style={styles.eyebrow}>Centre d’ops · Adhérents</Text>
        <Text style={styles.title} numberOfLines={1}>
          {user.display_name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {user.email}
        </Text>
        <View style={styles.tierRow}>
          <View style={[styles.tierPill, payant ? styles.tierPay : styles.tierFree]}>
            <Text style={[styles.tierPillText, payant && styles.tierPayText]}>
              {payant ? 'Payant' : 'Gratuit'}
            </Text>
          </View>
          {role === 'player' && previewAgeGroup ? (
            <View style={[styles.tierPill, styles.tierUniverse]}>
              <Text style={[styles.tierPillText, styles.tierUniverseText]}>
                {JOUEUR_UNIVERSE_LABELS[previewAgeGroup].title}
              </Text>
            </View>
          ) : null}
          {role === 'player' && gender ? (
            <View style={[styles.tierPill, styles.tierGender]}>
              <Text style={[styles.tierPillText, styles.tierGenderText]}>
                {adminGenderLabel(gender)}
              </Text>
            </View>
          ) : null}
          <Text style={styles.tierMeta}>
            {getRoleLabel(role)} · {adminProductLineLabel(productLine)}
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {(
          [
            { id: 'profil' as const, label: 'Profil' },
            ...(role === 'player' ? [{ id: 'univers' as const, label: 'Univers' }] : []),
            ...(role === 'parent' ? [{ id: 'famille' as const, label: 'Famille' }] : []),
            { id: 'role' as const, label: 'Rôle' },
            { id: 'offre' as const, label: 'Offre' },
            { id: 'docs' as const, label: 'Docs' },
            { id: 'actions' as const, label: 'Actions' },
          ] as { id: EditorTab; label: string }[]
        ).map(({ id, label }) => (
          <Pressable
            key={id}
            onPress={() => setTab(id)}
            style={[styles.tab, tab === id && styles.tabOn]}
          >
            <Text style={[styles.tabText, tab === id && styles.tabTextOn]}>
              {id === 'docs' && documents.length > 0 ? `${label} (${documents.length})` : label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          {tab === 'profil' ? (
            <>
              <Text style={styles.label}>Nom affiché</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholderTextColor={adminChrome.textMuted}
              />
              <Text style={styles.label}>Ville</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholderTextColor={adminChrome.textMuted}
              />
              <Text style={styles.label}>Intitulé métier</Text>
              <TextInput
                style={styles.input}
                value={jobTitle}
                onChangeText={setJobTitle}
                placeholder="Coach U17, dirigeant, kiné…"
                placeholderTextColor={adminChrome.textMuted}
              />

              {role === 'player' ? (
                <>
                  <Text style={styles.label}>Parcours / niveau</Text>
                  <View style={styles.chipRow}>
                    {PLAYER_LEVELS.map((id) => {
                      const on = playerLevel === id;
                      return (
                        <Pressable
                          key={id}
                          onPress={() => setPlayerLevel(id)}
                          style={[styles.chip, on && styles.chipOn]}
                        >
                          <Text style={[styles.chipText, on && styles.chipTextOn]}>
                            {PLAYER_LEVEL_BADGES[id].shortLabel}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={styles.label}>Poste</Text>
                  <View style={styles.chipRow}>
                    {POSITIONS.map((p) => {
                      const on = position === p;
                      return (
                        <Pressable
                          key={p}
                          onPress={() => setPosition(p)}
                          style={[styles.chip, on && styles.chipOn]}
                        >
                          <Text style={[styles.chipText, on && styles.chipTextOn]}>{p}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={styles.label}>Niveau compétition</Text>
                  <TextInput
                    style={styles.input}
                    value={level}
                    onChangeText={setLevel}
                    placeholder="District, Départemental, R1, N3…"
                    placeholderTextColor={adminChrome.textMuted}
                  />
                </>
              ) : null}

              {needsVerify ? (
                <>
                  <Text style={styles.label}>Vérification</Text>
                  <View style={styles.chipRow}>
                    {VERIFY.map((v) => {
                      const on = verificationStatus === v.id;
                      return (
                        <Pressable
                          key={v.id}
                          onPress={() => setVerificationStatus(v.id)}
                          style={[styles.chip, on && styles.chipOn]}
                        >
                          <Text style={[styles.chipText, on && styles.chipTextOn]}>{v.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : null}

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Compte actif</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: adminChrome.shellBorder, true: adminChrome.soft }}
                  thumbColor={isActive ? adminChrome.accent : '#FFF'}
                />
              </View>

              {role === 'player' ? (
                <Pressable
                  onPress={() => setTab('univers')}
                  style={styles.universLink}
                >
                  <Icon name="star-four-points" size={16} color={adminChrome.accent} />
                  <Text style={styles.universLinkText}>
                    Personnaliser l’univers (-13 / ado / adulte · H/F)
                  </Text>
                  <Icon name="chevron-forward" size={14} color={adminChrome.accent} />
                </Pressable>
              ) : null}

              <Pressable
                onPress={saveProfile}
                disabled={busy}
                style={[styles.primaryBtn, busy && styles.disabled]}
              >
                {busy ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Enregistrer le profil</Text>
                )}
              </Pressable>
            </>
          ) : null}

          {tab === 'univers' && role === 'player' ? (
            <>
              <View style={styles.universeHero}>
                <Text style={styles.universeHeroEyebrow}>Expérience Pôle Joueur</Text>
                <Text style={styles.universeHeroTitle}>
                  {previewAgeGroup
                    ? JOUEUR_UNIVERSE_LABELS[previewAgeGroup].title
                    : 'Univers à définir'}
                </Text>
                <Text style={styles.universeHeroSub}>
                  {previewAgeGroup
                    ? adminUniverseRangeLabel(previewAgeGroup)
                    : 'Renseigne la date de naissance pour basculer Monde -13, 13–17 ou 18+.'}
                  {gender ? ` · ${adminGenderLabel(gender)}` : ''}
                </Text>
                {birthValidation && birthValidation.ok ? (
                  <Text style={styles.universeHeroMeta}>
                    {birthValidation.age} ans · communauté{' '}
                    {adminAppSpaceLabel(appSpace ?? suggestedSpace)}
                  </Text>
                ) : null}
              </View>

              <Text style={styles.label}>Genre</Text>
              <View style={styles.chipRow}>
                {GENDERS.map((g) => {
                  const on = gender === g.id;
                  return (
                    <Pressable
                      key={g.id}
                      onPress={() => {
                        setGender(g.id);
                        if (previewAgeGroup) {
                          setAppSpace(suggestAppSpaceForPlayer(g.id, previewAgeGroup));
                        }
                      }}
                      style={[styles.chip, on && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{g.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <BirthDateFields
                day={birthDay}
                month={birthMonth}
                year={birthYear}
                onDay={setBirthDay}
                onMonth={setBirthMonth}
                onYear={setBirthYear}
                accent={adminChrome.accent}
                variant="light"
                label="Date de naissance"
                hint="Pilote automatiquement l’univers -13 / ado / adulte."
                error={
                  birthValidation && !birthValidation.ok ? birthValidation.reason : null
                }
              />

              <Text style={styles.label}>Cockpit / univers d’âge</Text>
              <Text style={[styles.hint, { fontSize: 12, marginTop: 2 }]}>
                Tape Monde -13, 13–17 ou 18+ puis « Enregistrer l’univers joueur ».
              </Text>
              <View style={styles.chipRow}>
                {(['youth', 'teen', 'adult'] as JoueurAgeGroup[]).map((id) => {
                  const on = previewAgeGroup === id;
                  return (
                    <Pressable
                      key={id}
                      onPress={() => applyAgeUniverse(id)}
                      style={[styles.chip, on && styles.chipOn]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={JOUEUR_UNIVERSE_LABELS[id].title}
                    >
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>
                        {JOUEUR_UNIVERSE_LABELS[id].title}
                      </Text>
                      <Text
                        style={[
                          styles.chipSub,
                          on && styles.chipTextOn,
                          !on && { color: adminChrome.textMuted },
                        ]}
                      >
                        {JOUEUR_UNIVERSE_LABELS[id].range}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Communauté (AppSpace)</Text>
              <View style={styles.chipRow}>
                {APP_SPACE_IDS.map((id) => {
                  const on = appSpace === id;
                  return (
                    <Pressable
                      key={id}
                      onPress={() => setAppSpace(id)}
                      style={[styles.chip, on && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>
                        {APP_SPACE_LABELS[id]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {suggestedSpace && appSpace !== suggestedSpace ? (
                <Pressable
                  onPress={() => setAppSpace(suggestedSpace)}
                  style={styles.suggestBtn}
                >
                  <Text style={styles.suggestBtnText}>
                    Appliquer la suggestion · {APP_SPACE_LABELS[suggestedSpace]}
                  </Text>
                </Pressable>
              ) : null}

              <Text style={styles.label}>Parcours / niveau</Text>
              <View style={styles.chipRow}>
                {PLAYER_LEVELS.map((id) => {
                  const on = playerLevel === id;
                  return (
                    <Pressable
                      key={id}
                      onPress={() => setPlayerLevel(id)}
                      style={[styles.chip, on && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>
                        {PLAYER_LEVEL_BADGES[id].shortLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Poste</Text>
              <View style={styles.chipRow}>
                {POSITIONS.map((p) => {
                  const on = position === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setPosition(p)}
                      style={[styles.chip, on && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{p}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Pied fort</Text>
              <View style={styles.chipRow}>
                {STRONG_FEET.map((f) => {
                  const on = strongFoot === f.id;
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => setStrongFoot(f.id)}
                      style={[styles.chip, on && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Catégorie</Text>
              <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholder="U7, U13 District, Seniors…"
                placeholderTextColor={adminChrome.textMuted}
              />

              <Text style={styles.label}>Numéro de maillot</Text>
              <TextInput
                style={styles.input}
                value={jerseyNumber}
                onChangeText={setJerseyNumber}
                keyboardType="number-pad"
                placeholder="10"
                placeholderTextColor={adminChrome.textMuted}
              />

              <Text style={styles.label}>Niveau compétition</Text>
              <TextInput
                style={styles.input}
                value={level}
                onChangeText={setLevel}
                placeholder="Départemental, R1, N3…"
                placeholderTextColor={adminChrome.textMuted}
              />

              <Text style={styles.label}>Bio / présentation</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                placeholder="Parcours, objectifs, club…"
                placeholderTextColor={adminChrome.textMuted}
              />

              <Pressable
                onPress={saveUnivers}
                disabled={busy}
                style={[styles.primaryBtn, busy && styles.disabled]}
              >
                {busy ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Enregistrer l’univers joueur</Text>
                )}
              </Pressable>
            </>
          ) : null}

          {tab === 'famille' && role === 'parent' ? (
            <>
              <Text style={styles.hint}>
                Liez des comptes joueurs mineurs à ce parent (`parent_of` + `parental_settings`).
                Les changements sont immédiats.
              </Text>
              <Text style={styles.label}>Enfants liés ({parentOfDraft.length})</Text>
              {parentOfDraft.length === 0 ? (
                <Text style={styles.hint}>Aucun enfant lié pour l’instant.</Text>
              ) : (
                parentOfDraft.map((childUid) => {
                  const child = linkedChildren.find((c) => c.uid === childUid);
                  const settings = child?.parental_settings;
                  return (
                    <View key={childUid} style={styles.familyCard}>
                      <Text style={styles.familyName}>
                        {child?.display_name ?? childUid}
                      </Text>
                      <Text style={styles.hint}>
                        {child?.email ?? 'Email —'} · UID {childUid}
                      </Text>
                      {settings ? (
                        <Text style={styles.hint}>
                          Écran {settings.screen_time_enabled ? 'ON' : 'OFF'} ·{' '}
                          {settings.daily_limit_minutes ?? 90} min · Messages{' '}
                          {settings.privacy?.parent_can_read_messages !== false
                            ? 'lisibles'
                            : 'masqués'}
                          {settings.unlock_request?.status === 'pending'
                            ? ` · Unlock +${settings.unlock_request.minutes} min`
                            : ''}
                        </Text>
                      ) : null}
                      <Pressable
                        onPress={() =>
                          void run(async () => {
                            await adminService.unlinkParentFromChild(user.uid, childUid);
                            setParentOfDraft((prev) => prev.filter((id) => id !== childUid));
                          }, `Enfant détaché · ${child?.display_name ?? childUid}`)
                        }
                        disabled={busy}
                        style={styles.secondaryBtn}
                      >
                        <Text style={styles.secondaryBtnText}>Détacher</Text>
                      </Pressable>
                    </View>
                  );
                })
              )}

              <Text style={styles.label}>Lier un enfant</Text>
              <Text style={styles.hint}>Email joueur ou UID Firestore</Text>
              <TextInput
                style={styles.input}
                value={linkChildQuery}
                onChangeText={setLinkChildQuery}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="player.demo@proday.app ou proday_demo_player_login"
                placeholderTextColor={adminChrome.textMuted}
              />
              <Pressable
                onPress={() => {
                  const q = linkChildQuery.trim();
                  if (!q) {
                    Alert.alert('Liaison', 'Indiquez un email ou un UID.');
                    return;
                  }
                  void run(async () => {
                    let child =
                      q.includes('@')
                        ? await adminService.findUserByEmail(q)
                        : await adminService.getUser(q);
                    if (!child && !q.includes('@')) {
                      child = await adminService.findUserByEmail(q);
                    }
                    if (!child) throw new Error('Compte enfant introuvable.');
                    if (child.role !== 'player') {
                      throw new Error('Seuls les comptes joueur peuvent être liés.');
                    }
                    await adminService.linkParentToChild(user.uid, child.uid);
                    setParentOfDraft((prev) =>
                      prev.includes(child!.uid) ? prev : [...prev, child!.uid],
                    );
                    setLinkChildQuery('');
                  }, `Enfant lié · ${q}`);
                }}
                disabled={busy}
                style={[styles.primaryBtn, busy && styles.disabled]}
              >
                {busy ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Lier l’enfant</Text>
                )}
              </Pressable>
            </>
          ) : null}

          {tab === 'role' ? (
            <>
              <Text style={styles.hint}>
                Change l’univers et le rôle métier (ex. Club → Joueur). Les formules d’abonnement
                disponibles suivent le nouveau rôle.
              </Text>
              <Text style={styles.label}>Univers</Text>
              <View style={styles.chipRow}>
                {ADMIN_PRODUCT_LINES.map((line) => {
                  const active = isJoueurProductLine(line)
                    ? isJoueurProductLine(productLine)
                    : productLine === line;
                  return (
                    <Pressable
                      key={line}
                      onPress={() => applyProductLine(line)}
                      style={[styles.chip, active && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextOn]}>
                        {adminProductLineLabel(line)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Rôle métier</Text>
              <View style={styles.roleList}>
                {metierRoles.map((r) => {
                  const on = role === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => applyRole(r)}
                      style={[styles.roleCard, on && styles.roleCardOn]}
                    >
                      <Text style={[styles.roleTitle, on && styles.roleTitleOn]}>
                        {getRoleLabel(r)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {role === 'sponsor' ? (
                <>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Sponsor approuvé</Text>
                    <Switch
                      value={sponsorApproved}
                      onValueChange={setSponsorApproved}
                      trackColor={{ false: adminChrome.shellBorder, true: adminChrome.soft }}
                      thumbColor={sponsorApproved ? adminChrome.accent : '#FFF'}
                    />
                  </View>
                  <Text style={styles.label}>Rang sponsor</Text>
                  <View style={styles.chipRow}>
                    {SPONSOR_TIERS.map((t) => {
                      const on = sponsorTier === t.id;
                      return (
                        <Pressable
                          key={t.id}
                          onPress={() => setSponsorTier(t.id)}
                          style={[styles.chip, on && styles.chipOn]}
                        >
                          <Text style={[styles.chipText, on && styles.chipTextOn]}>{t.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : null}

              <Pressable
                onPress={saveProfile}
                disabled={busy}
                style={[styles.primaryBtn, busy && styles.disabled]}
              >
                <Text style={styles.primaryBtnText}>
                  {role !== user.role
                    ? `Passer en ${getRoleLabel(role)}`
                    : 'Enregistrer le rôle'}
                </Text>
              </Pressable>
            </>
          ) : null}

          {tab === 'offre' ? (
            <>
              <View style={[styles.offerBanner, payant ? styles.offerPay : styles.offerFree]}>
                <Text style={styles.offerBannerTitle}>
                  {payant ? 'Abonnement payant actif' : 'Offre gratuite'}
                </Text>
                <Text style={styles.offerBannerSub}>
                  {payant
                    ? `${SUBSCRIPTION_PLANS[(user.subscription_plan_id as SubscriptionPlanId) || '']?.label ?? 'Pro'} · ${user.subscription_status ?? 'actif'}`
                    : noStore
                      ? 'Ce rôle n’a pas d’offre store.'
                      : 'Accès limité aux quotas gratuits.'}
                </Text>
                {user.subscription_period_end ? (
                  <Text style={styles.offerBannerMeta}>
                    Fin ·{' '}
                    {user.subscription_period_end.toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                ) : null}
              </View>

              {!noStore ? (
                <>
                  <Text style={styles.label}>Formule</Text>
                  <View style={styles.chipRow}>
                    {(rolePlans.length ? rolePlans : Object.values(SUBSCRIPTION_PLANS)).map((p) => {
                      const on = pickedPlan === p.id;
                      return (
                        <Pressable
                          key={p.id}
                          onPress={() => setPickedPlan(p.id)}
                          style={[styles.chip, on && styles.chipOn]}
                        >
                          <Text style={[styles.chipText, on && styles.chipTextOn]}>
                            {p.label}
                            {!p.pricing.quoteOnly
                              ? ` · ${p.pricing.monthlyEur.toFixed(2)} €`
                              : ' · devis'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={styles.label}>Durée (mois)</Text>
                  <View style={styles.chipRow}>
                    {[1, 3, 6, 12].map((n) => (
                      <Pressable
                        key={n}
                        onPress={() => setGrantMonths(n)}
                        style={[styles.chip, grantMonths === n && styles.chipOn]}
                      >
                        <Text style={[styles.chipText, grantMonths === n && styles.chipTextOn]}>
                          {n}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable
                    disabled={busy || !pickedPlan}
                    style={[styles.primaryBtn, (busy || !pickedPlan) && styles.disabled]}
                    onPress={() => {
                      if (!pickedPlan) return;
                      void run(
                        () =>
                          adminService.grantProSubscription(
                            user.uid,
                            pickedPlan,
                            grantMonths,
                            'Passage payant depuis Adhérents',
                            false,
                          ),
                        `Passage payant · ${pickedPlan} · ${grantMonths} mois`,
                      );
                    }}
                  >
                    <Text style={styles.primaryBtnText}>Passer en payant / Premium</Text>
                  </Pressable>

                  <Pressable
                    disabled={busy || !pickedPlan}
                    style={[styles.secondaryBtn, busy && styles.disabled]}
                    onPress={() => {
                      if (!pickedPlan) return;
                      void run(
                        () =>
                          adminService.grantProSubscription(
                            user.uid,
                            pickedPlan,
                            grantMonths,
                            'Essai offert depuis Adhérents',
                            true,
                          ),
                        `Essai · ${pickedPlan} · ${grantMonths} mois`,
                      );
                    }}
                  >
                    <Text style={styles.secondaryBtnText}>Offrir un essai</Text>
                  </Pressable>

                  {payant ? (
                    <>
                      <Pressable
                        disabled={busy}
                        style={[styles.secondaryBtn, busy && styles.disabled]}
                        onPress={() =>
                          void run(
                            () =>
                              adminService.extendSubscription(
                                user.uid,
                                30,
                                'Prolongation +30 j depuis Adhérents',
                              ),
                            'Prolongation +30 jours',
                          )
                        }
                      >
                        <Text style={styles.secondaryBtnText}>Prolonger +30 jours</Text>
                      </Pressable>
                      <Pressable
                        disabled={busy}
                        style={[styles.dangerBtn, busy && styles.disabled]}
                        onPress={() =>
                          Alert.alert(
                            'Passer en gratuit',
                            'Couper immédiatement l’accès payant ?',
                            [
                              { text: 'Annuler', style: 'cancel' },
                              {
                                text: 'Passer en gratuit',
                                style: 'destructive',
                                onPress: () =>
                                  void run(
                                    () =>
                                      adminService.revokeToFreeSubscription(
                                        user.uid,
                                        'Révocation depuis Adhérents',
                                        true,
                                      ),
                                    'Passage immédiat en gratuit',
                                  ),
                              },
                            ],
                          )
                        }
                      >
                        <Text style={styles.dangerBtnText}>Passer en gratuit</Text>
                      </Pressable>
                    </>
                  ) : null}
                </>
              ) : (
                <Text style={styles.hint}>
                  Aucune transition payante pour ce rôle (supporter / parent).
                </Text>
              )}
            </>
          ) : null}

          {tab === 'docs' ? (
            <>
              <Text style={styles.hint}>
                Documents d’onboarding. L’IA analyse à l’upload ; tu peux ouvrir le fichier puis
                valider ou refuser le compte.
              </Text>
              <View style={styles.verifyBanner}>
                <Text style={styles.verifyBannerTitle}>
                  Statut compte ·{' '}
                  {VERIFY.find((v) => v.id === user.verification_status)?.label ??
                    user.verification_status}
                </Text>
                {userNeedsAdminVerificationReview(user) ? (
                  <Text style={styles.verifyBannerSub}>Revue manuelle recommandée</Text>
                ) : null}
              </View>

              <Pressable
                disabled={busy}
                style={[styles.primaryBtn, busy && styles.disabled]}
                onPress={() =>
                  void run(
                    () => adminService.validateProfile(user.uid, 'approve'),
                    'Profil approuvé après revue documents',
                  )
                }
              >
                <Text style={styles.primaryBtnText}>Valider le compte</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                style={[styles.dangerBtn, busy && styles.disabled]}
                onPress={() =>
                  void run(
                    () =>
                      adminService.validateProfile(
                        user.uid,
                        'reject',
                        'Document non conforme (revue admin)',
                      ),
                    'Profil refusé après revue documents',
                  )
                }
              >
                <Text style={styles.dangerBtnText}>Refuser le compte</Text>
              </Pressable>

              <Text style={styles.label}>Fichiers</Text>
              {docsLoading ? (
                <ActivityIndicator color={adminChrome.accent} />
              ) : documents.length === 0 ? (
                <Text style={styles.hint}>Aucun document uploadé pour ce compte.</Text>
              ) : (
                documents.map((doc) => (
                  <View key={doc.id} style={styles.docCard}>
                    <View style={styles.docHead}>
                      <Icon name="document" size={18} color={adminChrome.accent} />
                      <View style={styles.docCopy}>
                        <Text style={styles.docTitle} numberOfLines={1}>
                          {doc.verification_check
                            ? DOC_CHECK_LABEL[doc.verification_check] ?? doc.verification_check
                            : doc.name}
                        </Text>
                        <Text style={styles.docMeta} numberOfLines={2}>
                          {aiStatusLabel(doc.ai_status)}
                          {doc.ai_confidence != null && Number.isFinite(doc.ai_confidence)
                            ? ` · ${Math.round(doc.ai_confidence * 100)} %`
                            : ''}
                        </Text>
                        {doc.ai_summary ? (
                          <Text style={styles.docSummary} numberOfLines={3}>
                            {doc.ai_summary}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <Pressable
                      style={styles.docOpenBtn}
                      onPress={() => {
                        if (!doc.url) {
                          Alert.alert('Document', 'URL indisponible pour ce fichier.');
                          return;
                        }
                        void Linking.openURL(doc.url).catch(() => {
                          Alert.alert('Document', 'Impossible d’ouvrir le fichier.');
                        });
                      }}
                    >
                      <Text style={styles.docOpenText}>
                        {doc.url ? 'Ouvrir le document' : 'Pas d’URL'}
                      </Text>
                      <Icon name="chevron-forward" size={14} color={adminChrome.accent} />
                    </Pressable>
                  </View>
                ))
              )}
            </>
          ) : null}

          {tab === 'actions' ? (
            <>
              <Pressable
                disabled={busy}
                style={[styles.secondaryBtn, busy && styles.disabled]}
                onPress={() =>
                  void run(
                    () => adminService.validateProfile(user.uid, 'approve'),
                    'Profil approuvé',
                  )
                }
              >
                <Text style={styles.secondaryBtnText}>Approuver le profil</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                style={[styles.secondaryBtn, busy && styles.disabled]}
                onPress={() =>
                  void run(
                    () => adminService.validateProfile(user.uid, 'reject', 'Refus admin'),
                    'Profil refusé',
                  )
                }
              >
                <Text style={styles.secondaryBtnText}>Refuser le profil</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                style={[styles.dangerBtn, busy && styles.disabled]}
                onPress={() =>
                  Alert.alert(
                    'Supprimer le compte',
                    `Supprimer définitivement ${user.display_name} ?`,
                    [
                      { text: 'Annuler', style: 'cancel' },
                      {
                        text: 'Supprimer',
                        style: 'destructive',
                        onPress: () =>
                          void run(async () => {
                            await adminService.deleteUserFull(user.uid);
                            onBack();
                          }, 'Compte supprimé'),
                      },
                    ],
                  )
                }
              >
                <Text style={styles.dangerBtnText}>Supprimer le compte</Text>
              </Pressable>
            </>
          ) : null}
      </ScrollView>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: adminChrome.band },
    header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      gap: 4,
      backgroundColor: adminChrome.shell,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: adminChrome.shellBorder,
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 2,
      marginBottom: spacing.xs,
      paddingVertical: 4,
      paddingRight: spacing.sm,
    },
    backLabel: { fontSize: 14, fontWeight: '700', color: adminChrome.accent },
    eyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: adminChrome.accent,
    },
    title: { fontSize: 22, fontWeight: '800', color: adminChrome.text, letterSpacing: -0.4 },
    sub: { fontSize: 13, color: adminChrome.textMuted },
    tierRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    tierPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: adminChrome.radiusSm,
      borderWidth: StyleSheet.hairlineWidth,
    },
    tierFree: { backgroundColor: adminChrome.shellElevated, borderColor: adminChrome.shellBorder },
    tierPay: { backgroundColor: adminChrome.soft, borderColor: adminChrome.accent },
    tierUniverse: { backgroundColor: adminChrome.pitchSoft, borderColor: adminChrome.pitch },
    tierGender: { backgroundColor: 'rgba(7, 20, 40, 0.05)', borderColor: adminChrome.shellBorder },
    tierPillText: { fontSize: 11, fontWeight: '800', color: adminChrome.textMuted },
    tierPayText: { color: adminChrome.accent },
    tierUniverseText: { color: adminChrome.pitch },
    tierGenderText: { color: adminChrome.text },
    tierMeta: { flex: 1, fontSize: 12, color: adminChrome.textMuted, fontWeight: '600' },
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      gap: 4,
      paddingVertical: spacing.sm,
      backgroundColor: adminChrome.shell,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: adminChrome.shellBorder,
    },
    tab: {
      flex: 1,
      paddingVertical: 9,
      paddingHorizontal: 2,
      borderRadius: adminChrome.radiusSm,
      backgroundColor: adminChrome.shellElevated,
      alignItems: 'center',
    },
    tabOn: { backgroundColor: adminChrome.accent },
    tabText: { fontSize: 11, fontWeight: '700', color: adminChrome.textMuted },
    tabTextOn: { color: '#FFF' },
    scroll: { flex: 1 },
    scrollInner: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl * 2 },
    label: {
      marginTop: spacing.sm,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: adminChrome.textMuted,
    },
    hint: { fontSize: 13, color: adminChrome.textMuted, lineHeight: 18 },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      backgroundColor: adminChrome.shellElevated,
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
      backgroundColor: adminChrome.shellElevated,
      gap: 2,
    },
    chipOn: { backgroundColor: adminChrome.accent, borderColor: adminChrome.accent },
    chipText: { fontSize: 12, fontWeight: '700', color: adminChrome.textMuted },
    chipSub: { fontSize: 10, fontWeight: '600' },
    chipTextOn: { color: '#FFF' },
    chipReadonly: { opacity: 0.95 },
    roleList: { gap: 8 },
    roleCard: {
      padding: spacing.md,
      borderRadius: adminChrome.radius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      backgroundColor: adminChrome.shellElevated,
    },
    roleCardOn: { borderColor: adminChrome.accent, backgroundColor: adminChrome.soft },
    roleTitle: { fontSize: 14, fontWeight: '700', color: adminChrome.text },
    roleTitleOn: { color: adminChrome.accent },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    switchLabel: { fontSize: 14, fontWeight: '600', color: adminChrome.text },
    offerBanner: {
      padding: spacing.md,
      borderRadius: adminChrome.radiusLg,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 4,
    },
    offerFree: { backgroundColor: adminChrome.shellElevated, borderColor: adminChrome.shellBorder },
    offerPay: { backgroundColor: adminChrome.soft, borderColor: adminChrome.accent },
    offerBannerTitle: { fontSize: 15, fontWeight: '800', color: adminChrome.text },
    offerBannerSub: { fontSize: 12, color: adminChrome.textMuted, lineHeight: 17 },
    offerBannerMeta: { fontSize: 11, color: adminChrome.textMuted, fontWeight: '600' },
    primaryBtn: {
      marginTop: spacing.md,
      backgroundColor: adminChrome.accent,
      borderRadius: adminChrome.radius,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
    secondaryBtn: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      backgroundColor: adminChrome.shellElevated,
      borderRadius: adminChrome.radius,
      paddingVertical: 14,
      alignItems: 'center',
    },
    secondaryBtnText: { color: adminChrome.text, fontWeight: '700', fontSize: 14 },
    familyCard: {
      padding: spacing.md,
      borderRadius: adminChrome.radius,
      backgroundColor: adminChrome.shellElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      gap: 4,
      marginTop: spacing.xs,
    },
    familyName: { fontSize: 15, fontWeight: '800', color: adminChrome.text },
    dangerBtn: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.danger,
      backgroundColor: 'rgba(220,38,73,0.08)',
      borderRadius: adminChrome.radius,
      paddingVertical: 14,
      alignItems: 'center',
    },
    dangerBtnText: { color: adminChrome.danger, fontWeight: '700', fontSize: 14 },
    disabled: { opacity: 0.45 },
    verifyBanner: {
      padding: spacing.md,
      borderRadius: adminChrome.radius,
      backgroundColor: adminChrome.shell,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      gap: 4,
    },
    verifyBannerTitle: { fontSize: 14, fontWeight: '800', color: adminChrome.text },
    verifyBannerSub: { fontSize: 12, color: adminChrome.warning, fontWeight: '600' },
    docCard: {
      padding: spacing.md,
      borderRadius: adminChrome.radius,
      backgroundColor: adminChrome.shell,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      gap: spacing.sm,
    },
    docHead: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
    docCopy: { flex: 1, minWidth: 0, gap: 2 },
    docTitle: { fontSize: 14, fontWeight: '700', color: adminChrome.text },
    docMeta: { fontSize: 12, fontWeight: '600', color: adminChrome.textMuted },
    docSummary: { fontSize: 12, color: adminChrome.textMuted, lineHeight: 17, marginTop: 4 },
    docOpenBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: adminChrome.radiusSm,
      backgroundColor: adminChrome.soft,
    },
    docOpenText: { fontSize: 13, fontWeight: '700', color: adminChrome.accent },
    universLink: {
      marginTop: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: adminChrome.radius,
      backgroundColor: adminChrome.soft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.accentMuted,
    },
    universLinkText: { flex: 1, fontSize: 13, fontWeight: '700', color: adminChrome.accent },
    universeHero: {
      padding: spacing.md,
      borderRadius: adminChrome.radiusLg,
      backgroundColor: adminChrome.shell,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      gap: 4,
      marginBottom: spacing.xs,
    },
    universeHeroEyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: adminChrome.accent,
    },
    universeHeroTitle: { fontSize: 22, fontWeight: '800', color: adminChrome.text, letterSpacing: -0.4 },
    universeHeroSub: { fontSize: 13, color: adminChrome.textMuted, lineHeight: 18 },
    universeHeroMeta: { fontSize: 12, fontWeight: '700', color: adminChrome.pitch, marginTop: 4 },
    suggestBtn: {
      alignSelf: 'flex-start',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: adminChrome.radiusSm,
      backgroundColor: adminChrome.pitchSoft,
    },
    suggestBtnText: { fontSize: 12, fontWeight: '700', color: adminChrome.pitch },
    inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  });
}
