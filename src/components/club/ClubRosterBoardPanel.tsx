import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { ProDaySurface } from '../ui/ProDaySurface';
import { PressableSpring } from '../motion';
import { ProDayFutCard } from '../cards/ProDayFutCard';
import { useAppTheme } from '../../context/ProductLineContext';
import { clubRosterBoardService } from '../../services/clubRosterBoard.service';
import { matchPlayersToRosterNeed } from '../../utils/clubRosterMatching';
import { userToProDayCard } from '../../utils/prodayFutCard';
import {
  INTERNAL_MOVE_STATUS_LABELS,
  ROSTER_POSITION_LABELS,
  type ClubRosterNeed,
  type InternalMoveProposal,
  type RosterMatchCandidate,
  type RosterPositionId,
} from '../../models/ClubRosterBoard';
import type { User } from '../../models/User';
import { teamsService } from '../../services/teams.service';
import type { Team } from '../../models/Team';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

type BoardTab = 'internal' | 'external' | 'moves';

const POSITIONS = Object.keys(ROSTER_POSITION_LABELS) as RosterPositionId[];
const CATEGORIES = ['U9', 'U11', 'U13', 'U15', 'U17', 'U18', 'U19', 'Seniors', 'Féminines'];

interface ClubRosterBoardPanelProps {
  clubId: string;
  profile: User;
  members: User[];
  /** Mode coach : préremplit l’équipe du coach. */
  defaultTeamId?: string;
  defaultTeamLabel?: string;
}

export const ClubRosterBoardPanel: React.FC<ClubRosterBoardPanelProps> = ({
  clubId,
  profile,
  members,
  defaultTeamId,
  defaultTeamLabel,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [tab, setTab] = useState<BoardTab>('internal');
  const [needs, setNeeds] = useState<ClubRosterNeed[]>([]);
  const [externalNeeds, setExternalNeeds] = useState<ClubRosterNeed[]>([]);
  const [moves, setMoves] = useState<InternalMoveProposal[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNeed, setSelectedNeed] = useState<ClubRosterNeed | null>(null);
  const [matches, setMatches] = useState<RosterMatchCandidate[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [formTeamId, setFormTeamId] = useState(defaultTeamId ?? '');
  const [formTeamLabel, setFormTeamLabel] = useState(defaultTeamLabel ?? '');
  const [formCategory, setFormCategory] = useState('U15');
  const [formPosition, setFormPosition] = useState<RosterPositionId>('defender');
  const [formNotes, setFormNotes] = useState('');
  const [formCount, setFormCount] = useState('1');
  const [formScope, setFormScope] = useState<'internal' | 'external'>('internal');
  const [saving, setSaving] = useState(false);
  const [cardPlayer, setCardPlayer] = useState<User | null>(null);
  const [cardCandidate, setCardCandidate] = useState<RosterMatchCandidate | null>(null);

  const teamLabelById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of teams) map[t.id] = t.name;
    return map;
  }, [teams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [n, ext, m, t] = await Promise.all([
        clubRosterBoardService.listNeedsForClub(clubId, 'internal'),
        clubRosterBoardService.listExternalNeeds(clubId),
        clubRosterBoardService.listMovesForClub(clubId),
        teamsService.listByClubId(clubId).catch(() => [] as Team[]),
      ]);
      setNeeds(n);
      setExternalNeeds(ext);
      setMoves(m);
      setTeams(t);
      if (!formTeamId && t[0]) {
        setFormTeamId(t[0].id);
        setFormTeamLabel(t[0].name);
        if (t[0].category) setFormCategory(t[0].category);
      }
    } finally {
      setLoading(false);
    }
  }, [clubId, formTeamId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedNeed) {
      setMatches([]);
      return;
    }
    setMatches(matchPlayersToRosterNeed(selectedNeed, members, teamLabelById));
  }, [selectedNeed, members, teamLabelById]);

  const createNeed = async () => {
    if (!formTeamId.trim() || !formTeamLabel.trim()) {
      Alert.alert('Équipe', 'Sélectionnez une équipe.');
      return;
    }
    setSaving(true);
    try {
      await clubRosterBoardService.createNeed({
        club_id: clubId,
        team_id: formTeamId,
        team_label: formTeamLabel,
        category: formCategory,
        position: formPosition,
        profile_notes: formNotes.trim() || undefined,
        players_needed: Math.max(1, parseInt(formCount, 10) || 1),
        scope: formScope,
        created_by_uid: profile.uid,
        created_by_name: profile.display_name,
      });
      setShowForm(false);
      setFormNotes('');
      await load();
      Alert.alert(
        'Besoin publié',
        formScope === 'internal'
          ? 'ProDay cherchera d’abord dans le vivier du club.'
          : 'La recherche est visible par les autres clubs ProDay.',
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible de créer le besoin.');
    } finally {
      setSaving(false);
    }
  };

  const proposeMove = (candidate: RosterMatchCandidate, need: ClubRosterNeed) => {
    Alert.alert(
      'Proposer une intégration',
      `Proposer ${candidate.display_name} (${candidate.team_label}) à ${need.team_label} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Proposer',
          onPress: () => {
            void (async () => {
              try {
                await clubRosterBoardService.proposeInternalMove({
                  club_id: clubId,
                  need_id: need.id,
                  player_uid: candidate.player_uid,
                  player_name: candidate.display_name,
                  from_team_id: candidate.team_id ?? candidate.category ?? 'unknown',
                  from_team_label: candidate.team_label,
                  to_team_id: need.team_id,
                  to_team_label: need.team_label,
                  proposed_by_uid: profile.uid,
                  proposed_by_name: profile.display_name,
                  match_score: candidate.score,
                  match_reasons: candidate.reasons,
                  message: `Proposition interne depuis la bourse de recrutement.`,
                });
                Alert.alert(
                  'Proposition envoyée',
                  'Le coach concerné et le club pourront valider. Statut : proposition envoyée.',
                );
                await load();
              } catch (e) {
                Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec.');
              }
            })();
          },
        },
      ],
    );
  };

  if (loading) {
    return <ActivityIndicator color={c.brand} style={{ marginVertical: spacing.lg }} />;
  }

  return (
    <View style={styles.wrap}>
      <ProDayText variant="section">Bourse de recrutement</ProDayText>
      <ProDayText variant="caption" muted style={styles.sub}>
        Avant de chercher dehors, cherchez dans votre club.
      </ProDayText>

      <View style={styles.tabs}>
        {(
          [
            { id: 'internal' as const, label: 'Dans mon club' },
            { id: 'external' as const, label: 'Entre clubs' },
            { id: 'moves' as const, label: 'Propositions' },
          ] as const
        ).map((t) => (
          <PressableSpring
            key={t.id}
            style={[styles.tab, tab === t.id && { backgroundColor: c.brand }]}
            onPress={() => {
              setTab(t.id);
              setSelectedNeed(null);
            }}
            scaleTo={0.96}
          >
            <ProDayText
              variant="caption"
              inverse={tab === t.id}
              style={tab !== t.id ? { color: c.textSecondary } : undefined}
            >
              {t.label}
            </ProDayText>
          </PressableSpring>
        ))}
      </View>

      <PressableSpring
        style={[styles.cta, { backgroundColor: c.brand }]}
        onPress={() => setShowForm((v) => !v)}
        scaleTo={0.97}
        haptic
      >
        <ProDayText variant="caption" inverse>
          {showForm ? 'Fermer' : '+ Besoin de mon équipe'}
        </ProDayText>
      </PressableSpring>

      {showForm ? (
        <ProDaySurface variant="module" style={[styles.form, { borderColor: c.border }]}>
          <ProDayText variant="caption" muted>
            Équipe
          </ProDayText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {teams.map((t) => (
              <PressableSpring
                key={t.id}
                style={[
                  styles.chip,
                  formTeamId === t.id && { backgroundColor: c.brand },
                  { borderColor: c.border },
                ]}
                onPress={() => {
                  setFormTeamId(t.id);
                  setFormTeamLabel(t.name);
                  if (t.category) setFormCategory(t.category);
                }}
                scaleTo={0.96}
              >
                <ProDayText variant="caption" inverse={formTeamId === t.id}>
                  {t.name}
                </ProDayText>
              </PressableSpring>
            ))}
          </ScrollView>
          {!teams.length ? (
            <TextInput
              style={[styles.input, { borderColor: c.border, color: c.text }]}
              placeholder="Nom d’équipe"
              placeholderTextColor={c.textMuted}
              value={formTeamLabel}
              onChangeText={(v) => {
                setFormTeamLabel(v);
                if (!formTeamId) setFormTeamId(`team-${profile.uid}`);
              }}
            />
          ) : null}

          <ProDayText variant="caption" muted>
            Catégorie
          </ProDayText>
          <View style={styles.wrapChips}>
            {CATEGORIES.map((cat) => (
              <PressableSpring
                key={cat}
                style={[
                  styles.chip,
                  formCategory === cat && { backgroundColor: c.brand },
                  { borderColor: c.border },
                ]}
                onPress={() => setFormCategory(cat)}
                scaleTo={0.96}
              >
                <ProDayText variant="caption" inverse={formCategory === cat}>
                  {cat}
                </ProDayText>
              </PressableSpring>
            ))}
          </View>

          <ProDayText variant="caption" muted>
            Poste
          </ProDayText>
          <View style={styles.wrapChips}>
            {POSITIONS.map((p) => (
              <PressableSpring
                key={p}
                style={[
                  styles.chip,
                  formPosition === p && { backgroundColor: c.brand },
                  { borderColor: c.border },
                ]}
                onPress={() => setFormPosition(p)}
                scaleTo={0.96}
              >
                <ProDayText variant="caption" inverse={formPosition === p}>
                  {ROSTER_POSITION_LABELS[p]}
                </ProDayText>
              </PressableSpring>
            ))}
          </View>

          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.text }]}
            placeholder="Profil recherché / commentaire"
            placeholderTextColor={c.textMuted}
            value={formNotes}
            onChangeText={setFormNotes}
          />
          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.text }]}
            placeholder="Nombre de joueurs"
            placeholderTextColor={c.textMuted}
            keyboardType="number-pad"
            value={formCount}
            onChangeText={setFormCount}
          />

          <View style={styles.tabs}>
            <PressableSpring
              style={[styles.tab, formScope === 'internal' && { backgroundColor: c.brand }]}
              onPress={() => setFormScope('internal')}
              scaleTo={0.96}
            >
              <ProDayText variant="caption" inverse={formScope === 'internal'}>
                Vivier club
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              style={[styles.tab, formScope === 'external' && { backgroundColor: c.brand }]}
              onPress={() => setFormScope('external')}
              scaleTo={0.96}
            >
              <ProDayText variant="caption" inverse={formScope === 'external'}>
                Publier hors club
              </ProDayText>
            </PressableSpring>
          </View>

          <PressableSpring
            style={[styles.cta, { backgroundColor: c.brand }]}
            onPress={() => void createNeed()}
            disabled={saving}
            scaleTo={0.97}
            haptic
          >
            {saving ? (
              <ActivityIndicator color={c.brandInverse} />
            ) : (
              <ProDayText variant="caption" inverse>
                Publier le besoin
              </ProDayText>
            )}
          </PressableSpring>
        </ProDaySurface>
      ) : null}

      {tab === 'internal' ? (
        <>
          <ProDayText variant="caption" muted style={styles.sub}>
            Équipes ayant des besoins
          </ProDayText>
          {needs.length === 0 ? (
            <ProDayText variant="caption" muted>
              Aucun besoin ouvert. Créez une recherche pour votre équipe.
            </ProDayText>
          ) : (
            needs.map((n) => (
              <PressableSpring
                key={n.id}
                style={[
                  styles.card,
                  {
                    borderColor: selectedNeed?.id === n.id ? c.brand : c.border,
                    backgroundColor: c.surface,
                  },
                ]}
                onPress={() => setSelectedNeed(n)}
                scaleTo={0.98}
              >
                <ProDayText variant="section">
                  {n.category} — {ROSTER_POSITION_LABELS[n.position]}
                </ProDayText>
                <ProDayText variant="caption" muted>
                  {n.team_label} · Besoin : {n.players_needed}
                </ProDayText>
                {n.profile_notes ? (
                  <ProDayText variant="caption" numberOfLines={2}>
                    {n.profile_notes}
                  </ProDayText>
                ) : null}
              </PressableSpring>
            ))
          )}

          {selectedNeed ? (
            <ProDaySurface variant="module" style={[styles.form, { borderColor: c.brand }]}>
              <ProDayText variant="section">
                Correspondance ProDay · {matches.length} profil
                {matches.length > 1 ? 's' : ''}
              </ProDayText>
              <ProDayText variant="caption" muted>
                Score indicatif — pas une vérité absolue. Ouvrez la carte et proposez.
              </ProDayText>
              {matches.length === 0 ? (
                <ProDayText variant="caption" muted style={styles.sub}>
                  Aucun profil interne fort. Essayez l’onglet « Entre clubs ».
                </ProDayText>
              ) : (
                matches.map((m) => (
                  <View key={m.player_uid} style={[styles.matchRow, { borderColor: c.border }]}>
                    <PressableSpring
                      style={{ flex: 1 }}
                      onPress={() => {
                        const u = members.find((x) => x.uid === m.player_uid) ?? null;
                        setCardPlayer(u);
                        setCardCandidate(m);
                      }}
                      scaleTo={0.98}
                    >
                      <ProDayText variant="section">
                        {m.tier === 'strong' ? '🟢' : m.tier === 'good' ? '🟡' : '⚪'} {m.display_name}{' '}
                        — {m.team_label}
                      </ProDayText>
                      <ProDayText variant="caption" accent>
                        {m.score} % de correspondance (indicatif)
                      </ProDayText>
                      <ProDayText variant="caption" muted>
                        {m.reasons.map((r) => `✓ ${r}`).join(' · ')}
                      </ProDayText>
                    </PressableSpring>
                    <PressableSpring
                      style={[styles.miniCta, { backgroundColor: c.brand }]}
                      onPress={() => proposeMove(m, selectedNeed)}
                      scaleTo={0.96}
                      haptic
                    >
                      <ProDayText variant="caption" inverse>
                        Proposer
                      </ProDayText>
                    </PressableSpring>
                  </View>
                ))
              )}
            </ProDaySurface>
          ) : null}
        </>
      ) : null}

      {tab === 'external' ? (
        <>
          <ProDayText variant="caption" muted style={styles.sub}>
            Recherches ouvertes entre clubs ProDay
          </ProDayText>
          {externalNeeds.length === 0 ? (
            <ProDayText variant="caption" muted>
              Aucune recherche externe pour le moment.
            </ProDayText>
          ) : (
            externalNeeds.map((n) => (
              <ProDaySurface
                key={n.id}
                variant="module"
                style={[styles.card, { borderColor: c.border }]}
              >
                <ProDayText variant="section">
                  🔎 {n.category} — {ROSTER_POSITION_LABELS[n.position]}
                </ProDayText>
                <ProDayText variant="caption" muted>
                  {n.team_label} · Contact : {n.created_by_name}
                </ProDayText>
                {n.profile_notes ? (
                  <ProDayText variant="caption">{n.profile_notes}</ProDayText>
                ) : null}
              </ProDaySurface>
            ))
          )}
        </>
      ) : null}

      {tab === 'moves' ? (
        <>
          {moves.length === 0 ? (
            <ProDayText variant="caption" muted>
              Aucune proposition interne.
            </ProDayText>
          ) : (
            moves.map((m) => (
              <ProDaySurface
                key={m.id}
                variant="module"
                style={[styles.card, { borderColor: c.border }]}
              >
                <ProDayText variant="section">
                  {m.player_name} → {m.to_team_label}
                </ProDayText>
                <ProDayText variant="caption" muted>
                  De {m.from_team_label} · {INTERNAL_MOVE_STATUS_LABELS[m.status]}
                  {m.match_score != null ? ` · ${m.match_score} %` : ''}
                </ProDayText>
                {profile.role === 'club' || profile.role === 'organizer' ? (
                  <View style={styles.tabs}>
                    <PressableSpring
                      style={[styles.miniCta, { backgroundColor: c.brand }]}
                      onPress={() =>
                        void clubRosterBoardService
                          .setMoveStatus(m.id, 'pending_club')
                          .then(load)
                      }
                      scaleTo={0.96}
                    >
                      <ProDayText variant="caption" inverse>
                        Valider club
                      </ProDayText>
                    </PressableSpring>
                    <PressableSpring
                      style={[styles.miniCta, { borderColor: c.border, borderWidth: 1 }]}
                      onPress={() =>
                        void clubRosterBoardService.setMoveStatus(m.id, 'declined').then(load)
                      }
                      scaleTo={0.96}
                    >
                      <ProDayText variant="caption">Refuser</ProDayText>
                    </PressableSpring>
                  </View>
                ) : null}
              </ProDaySurface>
            ))
          )}
        </>
      ) : null}

      <Modal
        visible={Boolean(cardPlayer && cardCandidate)}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setCardPlayer(null);
          setCardCandidate(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: c.surface }]}>
            <ProDayText variant="section">Carte Joueur ProDay</ProDayText>
            {cardCandidate ? (
              <ProDayText variant="caption" muted>
                {cardCandidate.score} % · {cardCandidate.reasons.join(' · ')} — indicatif
              </ProDayText>
            ) : null}
            {cardPlayer ? (
              <View style={styles.cardCenter}>
                <ProDayFutCard card={userToProDayCard(cardPlayer)} width={180} />
              </View>
            ) : null}
            <View style={styles.tabs}>
              {cardCandidate && selectedNeed ? (
                <PressableSpring
                  style={[styles.cta, { backgroundColor: c.brand }]}
                  onPress={() => {
                    const cand = cardCandidate;
                    const need = selectedNeed;
                    setCardPlayer(null);
                    setCardCandidate(null);
                    proposeMove(cand, need);
                  }}
                  scaleTo={0.97}
                  haptic
                >
                  <ProDayText variant="caption" inverse>
                    Proposer à mon équipe
                  </ProDayText>
                </PressableSpring>
              ) : null}
              <PressableSpring
                style={[styles.miniCta, { borderColor: c.border, borderWidth: 1 }]}
                onPress={() => {
                  setCardPlayer(null);
                  setCardCandidate(null);
                }}
                scaleTo={0.97}
              >
                <ProDayText variant="caption">Fermer</ProDayText>
              </PressableSpring>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: { gap: spacing.sm, marginTop: spacing.md },
    sub: { marginBottom: spacing.xs },
    tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    tab: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
    },
    cta: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
    },
    form: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    chips: { marginVertical: spacing.xs },
    wrapChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    chip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
    },
    card: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: 4,
      marginTop: spacing.xs,
    },
    matchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingTop: spacing.sm,
      marginTop: spacing.sm,
    },
    miniCta: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.md,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    modalCard: {
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardCenter: { alignItems: 'center', marginVertical: spacing.sm },
  });
}
