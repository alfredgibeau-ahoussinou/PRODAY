/**
 * Création d'un groupe de messagerie.
 *
 * Le parcours suit exactement les étapes demandées : nom → participants autorisés → relecture →
 * création confirmée → ouverture du **fil réel**.
 *
 * Ce que l'écran ne fait pas :
 *   - il ne décide pas qui est joignable : `evaluateGroupCandidates` applique la règle de contact
 *     d'autorité (`evaluateMessagingPermission`). Un contact refusé est listé **avec son motif** ;
 *   - il n'annonce pas un succès avant le retour du service : tant que `createGroupThread`
 *     n'a pas répondu, l'écran reste en « création en cours ». En cas d'échec, le motif réel est
 *     affiché et le brouillon est conservé pour réessayer ;
 *   - il ne propose pas d'envoi de fichier : la photo de groupe est une **adresse d'image**.
 *     Il n'existe pas encore de pipeline d'envoi de fichier pour les groupes ; le dire est
 *     préférable à une icône d'appareil photo inerte.
 *
 * L'image de groupe étant optionnelle, son absence est un état normal, pas une erreur.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedModalShell, PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import type { User, UserRole } from '../../models/User';
import { isMinorUser } from '../../utils/minor';
import { evaluateMessagingPermission } from '../../utils/parentalMessaging';
import { usersService } from '../../services/users.service';
import { messagesService } from '../../services/messages.service';
import {
  MAX_GROUP_NAME,
  buildGroupThreadId,
  buildGroupThreadPayload,
  evaluateGroupCandidates,
  humanizeGroupError,
  isGroupDraftValid,
  newMembersSeeHistory,
  validateGroupDraft,
} from '../../features/messaging/groupDraft';
import type { GroupCandidate, GroupDraft } from '../../features/messaging/groupDraft';

type Step = 'details' | 'participants' | 'review';

type Props = {
  visible: boolean;
  onClose: () => void;
  profile: User | null;
  /** Appelé **uniquement** après création confirmée par le service, avec le fil réel. */
  onCreated: (threadId: string) => void;
};

function randomToken(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function CreateGroupSheet({ visible, onClose, profile, onCreated }: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selected, setSelected] = useState<GroupCandidate[]>([]);
  const [candidates, setCandidates] = useState<GroupCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const clubId = profile?.profile.club_id ?? '';

  // Charge les contacts légitimement accessibles : les membres du club du compte connecté.
  useEffect(() => {
    if (!visible || !clubId) return;
    let cancelled = false;
    setLoadingCandidates(true);
    setCandidateError(null);
    void usersService
      .listMembersByClubId(clubId)
      .then((members) => {
        if (cancelled) return;
        setCandidates(
          members
            .filter((m) => m.uid !== profile?.uid)
            .map((m) => ({
              uid: m.uid,
              displayName: m.display_name,
              role: m.role as UserRole,
              avatarUrl: m.avatar_url,
              isMinor: isMinorUser(m),
            })),
        );
      })
      .catch((e) => {
        if (cancelled) return;
        setCandidates([]);
        setCandidateError(
          e instanceof Error && e.message
            ? `Contacts indisponibles : ${e.message}`
            : 'Contacts indisponibles pour le moment.',
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingCandidates(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, clubId, profile?.uid]);

  const draft: GroupDraft = useMemo(
    () => ({
      name,
      creatorUid: profile?.uid ?? '',
      creatorName: profile?.display_name ?? 'Moi',
      creatorRole: (profile?.role as UserRole) ?? 'player',
      selected,
      avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : undefined,
    }),
    [avatarUrl, name, profile, selected],
  );

  const errors = useMemo(() => validateGroupDraft(draft), [draft]);

  const candidateStates = useMemo(
    () =>
      evaluateGroupCandidates(candidates, selected.map((s) => s.uid), (candidate) => {
        if (!profile) return { allowed: false, reason: 'Connectez-vous pour créer un groupe.' };
        const target = candidates.find((c) => c.uid === candidate.uid);
        if (!target) return { allowed: false, reason: 'Contact introuvable.' };
        // La règle d'autorité est appliquée sur l'utilisateur réel, pas sur une copie locale.
        const asUser = {
          uid: target.uid,
          role: target.role,
          display_name: target.displayName,
        } as User;
        const decision = evaluateMessagingPermission(profile, asUser);
        return { allowed: decision.allowed, reason: decision.message ?? decision.title };
      }),
    [candidates, profile, selected],
  );

  const visibleCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidateStates;
    return candidateStates.filter(
      (s) =>
        s.candidate.displayName.toLowerCase().includes(q) ||
        s.candidate.role.toLowerCase().includes(q),
    );
  }, [candidateStates, search]);

  const toggle = useCallback(
    (candidate: GroupCandidate, selectable: boolean) => {
      if (!selectable) return;
      setSelected((prev) =>
        prev.some((p) => p.uid === candidate.uid)
          ? prev.filter((p) => p.uid !== candidate.uid)
          : [...prev, candidate],
      );
    },
    [],
  );

  const reset = useCallback(() => {
    setStep('details');
    setName('');
    setAvatarUrl('');
    setSelected([]);
    setSearch('');
    setCreateError(null);
  }, []);

  const submit = useCallback(async () => {
    if (creating || !isGroupDraftValid(draft)) return;
    setCreating(true);
    setCreateError(null);
    try {
      const payload = buildGroupThreadPayload(draft, buildGroupThreadId(randomToken));
      const threadId = await messagesService.createGroupThread(payload);
      // Succès confirmé par le service : on ouvre le fil réel, puis on réinitialise le brouillon.
      onCreated(threadId);
      reset();
      onClose();
    } catch (e) {
      // Le message brut du service est traduit : il ne doit jamais annoncer un succès qui n'a pas eu lieu,
      // ni laisser un « Missing or insufficient permissions. » opaque à l'écran.
      setCreateError(
        `${humanizeGroupError(e instanceof Error ? e.message : '')} Le brouillon est conservé, vous pouvez réessayer.`,
      );
    } finally {
      setCreating(false);
    }
  }, [creating, draft, onClose, onCreated, reset]);

  const styles = useMemo(() => createStyles(), []);

  if (!visible) return null;

  const stepIndex = step === 'details' ? 1 : step === 'participants' ? 2 : 3;

  return (
    <AnimatedModalShell visible={visible} onClose={onClose} variant="tall" handleOnly>
      <View style={[styles.root, { paddingBottom: insets.bottom + 12 }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} accessibilityLabel="Fermer la création de groupe" hitSlop={10}>
            <Icon name="close" size={18} color={colors.textSecondary} />
          </Pressable>
          <ProDayText variant="section" style={styles.title}>
            Nouveau groupe
          </ProDayText>
          <ProDayText variant="caption" style={{ color: colors.textSecondary }}>
            {stepIndex}/3
          </ProDayText>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {step === 'details' ? (
            <>
              <ProDayText variant="body" style={styles.label}>
                Nom du groupe
              </ProDayText>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Ex. Parents U15"
                placeholderTextColor={colors.textSecondary}
                maxLength={MAX_GROUP_NAME}
                accessibilityLabel="Nom du groupe"
              />
              {errors.name ? (
                <ProDayText variant="caption" style={{ color: colors.error }}>
                  {errors.name}
                </ProDayText>
              ) : null}

              <ProDayText variant="body" style={[styles.label, { marginTop: spacing.md }]}>
                Image du groupe (optionnel)
              </ProDayText>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface },
                ]}
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                placeholder="Adresse d’une image (https://…)"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                accessibilityLabel="Adresse de l’image du groupe"
              />
              <ProDayText variant="caption" style={{ color: colors.textSecondary }}>
                L’envoi de fichier n’est pas encore disponible pour les groupes : indiquez une
                adresse d’image, ou laissez vide.
              </ProDayText>
            </>
          ) : null}

          {step === 'participants' ? (
            <>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface },
                ]}
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher un contact"
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Rechercher un contact"
              />
              {loadingCandidates ? (
                <View style={styles.center}>
                  <ActivityIndicator color={colors.accent} />
                </View>
              ) : null}
              {candidateError ? (
                <ProDayText variant="caption" style={{ color: colors.warning }}>
                  {candidateError}
                </ProDayText>
              ) : null}
              {!loadingCandidates && !candidateError && visibleCandidates.length === 0 ? (
                <ProDayText variant="caption" style={{ color: colors.textSecondary }}>
                  Aucun contact autorisé trouvé pour ce compte.
                </ProDayText>
              ) : null}
              {visibleCandidates.map((state) => {
                const isOn = state.alreadySelected;
                return (
                  <PressableSpring
                    key={state.candidate.uid}
                    onPress={() => toggle(state.candidate, state.selectable)}
                    disabled={!state.selectable}
                    scaleTo={0.98}
                    style={[
                      styles.row,
                      {
                        borderColor: isOn ? colors.accent : colors.border,
                        backgroundColor: isOn ? colors.accentSoft : colors.surface,
                        opacity: state.selectable ? 1 : 0.6,
                      },
                    ]}
                  >
                    <View style={styles.rowText}>
                      <ProDayText variant="body" style={styles.rowTitle}>
                        {state.candidate.displayName}
                      </ProDayText>
                      <ProDayText variant="caption" style={{ color: colors.textSecondary }}>
                        {state.candidate.role}
                        {state.candidate.isMinor ? ' · mineur' : ''}
                      </ProDayText>
                      {state.blockedReason ? (
                        <ProDayText variant="caption" style={{ color: colors.warning }}>
                          {state.blockedReason}
                        </ProDayText>
                      ) : null}
                    </View>
                    {isOn ? <Icon name="checkmark-circle" size={16} color={colors.accent} /> : null}
                  </PressableSpring>
                );
              })}
              {errors.participants ? (
                <ProDayText variant="caption" style={{ color: colors.error }}>
                  {errors.participants}
                </ProDayText>
              ) : null}
            </>
          ) : null}

          {step === 'review' ? (
            <>
              <ProDayText variant="section" style={styles.title}>
                {name.trim()}
              </ProDayText>
              <ProDayText variant="caption" style={{ color: colors.textSecondary }}>
                {selected.length + 1} participant(s) · vous inclus
              </ProDayText>
              <View style={[styles.reviewCard, { borderColor: colors.border }]}>
                <ProDayText variant="body" style={styles.rowTitle}>
                  {profile?.display_name ?? 'Vous'} (administrateur)
                </ProDayText>
                {selected.map((p) => (
                  <ProDayText key={p.uid} variant="body" style={styles.rowTitle}>
                    {p.displayName}
                  </ProDayText>
                ))}
              </View>
              <ProDayText variant="caption" style={{ color: colors.textSecondary }}>
                Les membres ajoutés plus tard verront l’historique de la conversation :{' '}
                {newMembersSeeHistory() ? 'oui' : 'non'}. Les administrateurs pourront ajouter ou
                retirer des membres après la création.
              </ProDayText>
              {createError ? (
                <ProDayText variant="caption" style={{ color: colors.error }}>
                  {createError}
                </ProDayText>
              ) : null}
            </>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {step !== 'details' ? (
            <Pressable
              onPress={() => setStep(step === 'review' ? 'participants' : 'details')}
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
            >
              <ProDayText variant="body" style={{ color: colors.text }}>
                Retour
              </ProDayText>
            </Pressable>
          ) : null}
          {step === 'details' ? (
            <Pressable
              onPress={() => setStep('participants')}
              disabled={Boolean(errors.name)}
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.accent, opacity: errors.name ? 0.5 : 1 },
              ]}
            >
              <ProDayText variant="body" style={{ color: colors.brandInverse, fontWeight: '700' }}>
                Choisir les participants
              </ProDayText>
            </Pressable>
          ) : step === 'participants' ? (
            <Pressable
              onPress={() => setStep('review')}
              disabled={Boolean(errors.participants)}
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.accent, opacity: errors.participants ? 0.5 : 1 },
              ]}
            >
              <ProDayText variant="body" style={{ color: colors.brandInverse, fontWeight: '700' }}>
                Relecture
              </ProDayText>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => void submit()}
              disabled={creating || !isGroupDraftValid(draft)}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: colors.accent,
                  opacity: creating || !isGroupDraftValid(draft) ? 0.5 : 1,
                },
              ]}
              accessibilityLabel="Créer le groupe"
            >
              {creating ? (
                <ActivityIndicator color={colors.brandInverse} />
              ) : (
                <ProDayText variant="body" style={{ color: colors.brandInverse, fontWeight: '700' }}>
                  Créer le groupe
                </ProDayText>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </AnimatedModalShell>
  );
}

const createStyles = () =>
  StyleSheet.create({
    root: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    title: { fontSize: 16, fontWeight: '700' },
    body: { padding: spacing.md, gap: 8 },
    label: { fontSize: 14, fontWeight: '600' },
    input: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
      fontSize: 15,
      minHeight: 44,
    },
    center: { paddingVertical: spacing.lg, alignItems: 'center' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    rowText: { flex: 1, gap: 2 },
    rowTitle: { fontSize: 14 },
    reviewCard: {
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: 4,
    },
    footer: {
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    secondaryBtn: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtn: {
      flex: 1,
      borderRadius: radius.md,
      paddingVertical: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
