import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { proSemantic, proRadius, proForm } from '../../theme/professionalDesign';
import { withAlpha } from '../../utils/coachTeamTheme';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { usersService } from '../../services/users.service';
import { coachEvaluationsService } from '../../services/coachEvaluations.service';
import { coachObjectivesService } from '../../services/coachObjectives.service';
import type { User } from '../../models/User';
import type { CoachPlayerEvaluation } from '../../models/CoachEvaluation';
import type { CoachSeasonObjective } from '../../models/CoachSeasonObjective';
import { formatCoachRating } from '../../utils/coachEvaluationRatings';
import { CoachPlayerEvaluationSheet } from '../../components/coach/growth/CoachPlayerEvaluationSheet';
import { PressableSpring } from '../../components/motion';
import { CoachText } from '../../components/coach/coachPortalUi';
import { CoachScreenHeader } from '../../components/coach/CoachScreenHeader';

interface OpponentScout {
  id: string;
  name: string;
  rank: string;
  nextMatchDate: string;
  system: string;
  dangerPlayer: string;
  weakness: string;
}

const OPPONENTS_SCOUT: OpponentScout[] = [
  {
    id: 'opp1',
    name: 'RC France Academy',
    rank: '2e (35 pts)',
    nextMatchDate: 'Ce Dimanche · 15:00 (J17)',
    system: '3-5-2 Contre Direct',
    dangerPlayer: 'Numéro 9 (12 buts cette saison, fort jeu de tête)',
    weakness: 'Espaces béants dans le dos des pistons en transition défensive.',
  },
  {
    id: 'opp2',
    name: 'AS Montferrand',
    rank: '3e (31 pts)',
    nextMatchDate: 'Dimanche 22 Mars · 15:00 (J18)',
    system: '4-4-2 Bloc Médian Compact',
    dangerPlayer: 'Numéro 10 (Meneur créateur, 8 passes décisives)',
    weakness: 'Difficultés face à un pressing haut et intense dès la 60e minute.',
  },
  {
    id: 'opp3',
    name: 'Olympique Paris Sud',
    rank: '4e (27 pts)',
    nextMatchDate: 'Dimanche 29 Mars · 15:00 (J19)',
    system: '4-3-3 Attaque Posée',
    dangerPlayer: 'Ailier Gauche (Vitesse pure > 33 km/h)',
    weakness: 'Fragilité sur coups de pied arrêtés défensifs (35% des buts concédés).',
  },
];

type GrowthTab = 'growth' | 'team_objectives' | 'opponents' | 'staff_channel';
type PositionFilter = 'all' | 'gk' | 'def' | 'mid' | 'att';

const POSITION_FILTERS: { key: PositionFilter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'gk', label: 'Gardiens' },
  { key: 'def', label: 'Défenseurs' },
  { key: 'mid', label: 'Milieux' },
  { key: 'att', label: 'Attaquants' },
];

function matchesPositionFilter(user: User, filter: PositionFilter): boolean {
  if (filter === 'all') return true;
  const pos = (user.profile?.position || '').toLowerCase();
  switch (filter) {
    case 'gk':
      return pos.includes('gardien') || pos.includes('gk') || pos.includes('goal');
    case 'def':
      return (
        pos.includes('défens') ||
        pos.includes('defens') ||
        pos.includes('latéral') ||
        pos.includes('lateral') ||
        pos.includes('axial') ||
        pos.includes('cb') ||
        pos.includes('lb') ||
        pos.includes('rb')
      );
    case 'mid':
      return (
        pos.includes('milieu') ||
        pos.includes('mid') ||
        pos.includes('relayeur') ||
        pos.includes('mdf') ||
        pos.includes('mc') ||
        pos.includes('mo')
      );
    case 'att':
      return (
        pos.includes('attaq') ||
        pos.includes('avant') ||
        pos.includes('ailier') ||
        pos.includes('buteur') ||
        pos.includes('striker') ||
        pos.includes('fw')
      );
    default:
      return true;
  }
}

export const CoachScoutingGrowthScreen: React.FC = () => {
  const { tokens, teamId, teamName } = useCoachTheme();
  const session = useSessionProfile();

  const clubId = session?.profile.club_id || '';
  const coachUid = session?.uid || 'coach';

  const [activeTab, setActiveTab] = useState<GrowthTab>('growth');
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('all');

  // Real data state
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [players, setPlayers] = useState<User[]>([]);
  const [evaluationsMap, setEvaluationsMap] = useState<Record<string, CoachPlayerEvaluation | undefined>>({});
  const [objectivesMap, setObjectivesMap] = useState<Record<string, CoachSeasonObjective[]>>({});
  const [teamObjectives, setTeamObjectives] = useState<CoachSeasonObjective[]>([]);

  // Evaluation sheet modal state
  const [evaluatingPlayer, setEvaluatingPlayer] = useState<User | null>(null);

  // New team objective creation form state
  const [showAddTeamObjective, setShowAddTeamObjective] = useState<boolean>(false);
  const [newTeamObjTitle, setNewTeamObjTitle] = useState<string>('');
  const [newTeamObjDesc, setNewTeamObjDesc] = useState<string>('');
  const [newTeamObjTarget, setNewTeamObjTarget] = useState<string>('');
  const [newTeamObjProgress, setNewTeamObjProgress] = useState<number>(0);
  const [savingTeamObjective, setSavingTeamObjective] = useState<boolean>(false);

  const loadAll = useCallback(async () => {
    if (!clubId) {
      setLoading(false);
      return;
    }
    try {
      const [members, evals, objectives] = await Promise.all([
        usersService.listMembersByClubId(clubId),
        coachEvaluationsService.listForClub(clubId, 100),
        coachObjectivesService.listForClub(clubId, 100),
      ]);

      // Filter players in club
      const realPlayers = members.filter((m) => m.role === 'player' || !m.role);
      setPlayers(realPlayers.length > 0 ? realPlayers : members);

      // Latest evaluation per player
      const evMap: Record<string, CoachPlayerEvaluation | undefined> = {};
      for (const ev of evals) {
        if (!evMap[ev.player_uid]) {
          evMap[ev.player_uid] = ev;
        }
      }
      setEvaluationsMap(evMap);

      // Objectives per player & team objectives
      const objMap: Record<string, CoachSeasonObjective[]> = {};
      const teamObjs: CoachSeasonObjective[] = [];
      for (const obj of objectives) {
        if (obj.scope === 'player' && obj.player_uid) {
          if (!objMap[obj.player_uid]) objMap[obj.player_uid] = [];
          objMap[obj.player_uid].push(obj);
        } else if (obj.scope === 'team') {
          teamObjs.push(obj);
        }
      }
      setObjectivesMap(objMap);
      setTeamObjectives(teamObjs);
    } catch (err) {
      console.warn('[CoachScoutingGrowthScreen] load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clubId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadAll();
  }, [loadAll]);

  // Filtered players according to selected position
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => matchesPositionFilter(p, positionFilter));
  }, [players, positionFilter]);

  const handleCreateTeamObjective = async () => {
    if (!newTeamObjTitle.trim()) {
      Alert.alert('Champ requis', 'Veuillez saisir un intitulé pour l’objectif d’équipe.');
      return;
    }
    setSavingTeamObjective(true);
    try {
      await coachObjectivesService.create(coachUid, {
        club_id: clubId,
        team_id: teamId,
        scope: 'team',
        title: newTeamObjTitle.trim(),
        description: newTeamObjDesc.trim() || undefined,
        target_label: newTeamObjTarget.trim() || undefined,
        progress: newTeamObjProgress,
        season_label: 'Saison en cours',
      });
      setNewTeamObjTitle('');
      setNewTeamObjDesc('');
      setNewTeamObjTarget('');
      setNewTeamObjProgress(0);
      setShowAddTeamObjective(false);
      void loadAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Impossible de créer l’objectif.';
      Alert.alert('Erreur', msg);
    } finally {
      setSavingTeamObjective(false);
    }
  };

  const handleUpdateTeamObjProgress = async (id: string, newProgress: number) => {
    const clamped = Math.min(100, Math.max(0, newProgress));
    setTeamObjectives((prev) =>
      prev.map((o) => (o.id === id ? { ...o, progress: clamped } : o)),
    );
    try {
      await coachObjectivesService.setProgress(id, clamped);
    } catch {
      void loadAll();
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: tokens.bg }]}>
      <CoachScreenHeader
        title="Suivi Joueurs & Objectifs"
        fallbackNavId="plus"
        hasUnsavedChanges={Boolean(newTeamObjTitle.trim())}
      />
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.accent}
          />
        }
      >
        {/* 1. Header: 360° Scouting, Bilan & Objectifs */}
        <View style={[styles.header, { backgroundColor: tokens.surface, borderColor: withAlpha('0A84FF', 0.25) }]}>
          <View style={[styles.headerIcon, { backgroundColor: withAlpha('0A84FF', 0.15) }]}>
            <MaterialCommunityIcons name="account-search" size={24} color={proSemantic.info} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={[styles.badgePsd, { backgroundColor: withAlpha('0A84FF', 0.15) }]}>
                <Text style={styles.badgePsdText}>Suivi 360°</Text>
              </View>
              <View style={[styles.badgeCert, { backgroundColor: withAlpha(tokens.accent, 0.15) }]}>
                <Text style={[styles.badgeCertText, { color: tokens.accent }]}>Objectifs de Saison</Text>
              </View>
            </View>
            <Text style={[styles.headerTitle, { color: tokens.foreground }]}>
              Suivi Joueur 360° & Objectifs
            </Text>
            <Text style={[styles.headerSubtitle, { color: tokens.muted }]}>
              {teamName || 'Effectif du club'} · {players.length} joueur{players.length > 1 ? 's' : ''} inscrits
            </Text>
          </View>
        </View>

        {/* 2. Top Segment Switcher */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segmentBarScroll}
          style={{ marginBottom: 14 }}
        >
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'growth' && { backgroundColor: tokens.elevated }]}
            onPress={() => setActiveTab('growth')}
          >
            <Text style={[styles.segmentBtnText, { color: activeTab === 'growth' ? tokens.foreground : tokens.muted }]}>
              Bilan 360° ({players.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'team_objectives' && { backgroundColor: tokens.elevated }]}
            onPress={() => setActiveTab('team_objectives')}
          >
            <Text style={[styles.segmentBtnText, { color: activeTab === 'team_objectives' ? tokens.foreground : tokens.muted }]}>
              Objectifs Collectifs ({teamObjectives.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'opponents' && { backgroundColor: tokens.elevated }]}
            onPress={() => setActiveTab('opponents')}
          >
            <Text style={[styles.segmentBtnText, { color: activeTab === 'opponents' ? tokens.foreground : tokens.muted }]}>
              Base Adversaires ({OPPONENTS_SCOUT.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'staff_channel' && { backgroundColor: tokens.elevated }]}
            onPress={() => setActiveTab('staff_channel')}
          >
            <Text style={[styles.segmentBtnText, { color: activeTab === 'staff_channel' ? tokens.foreground : tokens.muted }]}>
              Canal Staff
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* TAB 1: 360° PLAYER GROWTH & ROSTER */}
        {activeTab === 'growth' && (
          <>
            {/* Position Filter Chips */}
            <View style={styles.filterRow}>
              {POSITION_FILTERS.map((f) => {
                const isActive = positionFilter === f.key;
                return (
                  <PressableSpring
                    key={f.key}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isActive ? withAlpha(tokens.accent, 0.15) : tokens.surface,
                        borderColor: isActive ? tokens.accent : tokens.border,
                      },
                    ]}
                    onPress={() => setPositionFilter(f.key)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: isActive ? tokens.accent : tokens.muted, fontWeight: isActive ? '700' : '500' },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </PressableSpring>
                );
              })}
            </View>

            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={tokens.accent} />
                <CoachText variant="caption" muted style={{ marginTop: 12 }}>
                  Chargement de l’effectif réel...
                </CoachText>
              </View>
            ) : filteredPlayers.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                <Feather name="users" size={28} color={tokens.muted} />
                <CoachText variant="body" style={{ fontWeight: '700', marginTop: 10, color: tokens.foreground }}>
                  Aucun joueur trouvé
                </CoachText>
                <CoachText variant="caption" muted style={{ textAlign: 'center', marginTop: 4 }}>
                  Aucun membre ne correspond au filtre de poste sélectionné.
                </CoachText>
              </View>
            ) : (
              filteredPlayers.map((player) => {
                const lastEval = evaluationsMap[player.uid];
                const playerObjs = objectivesMap[player.uid] || [];
                const avgProgress =
                  playerObjs.length > 0
                    ? Math.round(
                        playerObjs.reduce((acc, o) => acc + o.progress, 0) / playerObjs.length,
                      )
                    : null;

                return (
                  <View
                    key={player.uid}
                    style={[styles.playerCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                  >
                    {/* Header Joueur */}
                    <View style={styles.playerCardTop}>
                      <View style={[styles.avatarCircle, { backgroundColor: withAlpha(tokens.accent, 0.2) }]}>
                        <Text style={[styles.avatarInitials, { color: tokens.accent }]}>
                          {player.display_name.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.playerNameText, { color: tokens.foreground }]}>
                            {player.display_name}
                          </Text>
                          {lastEval?.visible_to_player && (
                            <View style={[styles.tagMini, { backgroundColor: proSemantic.successSoft }]}>
                              <Text style={[styles.tagMiniText, { color: proSemantic.success }]}>Partagé</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.playerMetaText, { color: tokens.muted }]}>
                          {player.profile?.position || 'Poste non défini'}
                          {player.profile?.category ? ` · ${player.profile.category}` : ''}
                          {player.profile?.age ? ` · ${player.profile.age} ans` : ''}
                        </Text>
                      </View>

                      {/* Overall Note Badge */}
                      {lastEval ? (
                        <View style={[styles.overallScoreBadge, { backgroundColor: withAlpha(tokens.accent, 0.15), borderColor: tokens.accent }]}>
                          <Text style={[styles.overallScoreVal, { color: tokens.accent }]}>
                            {formatCoachRating(lastEval.ratings.overall)}
                          </Text>
                          <Text style={[styles.overallScoreLabel, { color: tokens.accent }]}>Global</Text>
                        </View>
                      ) : (
                        <View style={[styles.overallScoreBadge, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                          <Text style={[styles.overallScoreVal, { color: tokens.muted }]}>—</Text>
                          <Text style={[styles.overallScoreLabel, { color: tokens.muted }]}>Non noté</Text>
                        </View>
                      )}
                    </View>

                    {/* Dimensions Radar Breakdown */}
                    {lastEval && (
                      <View style={[styles.radarPillsRow, { backgroundColor: tokens.elevated }]}>
                        <View style={styles.radarPillItem}>
                          <Text style={[styles.radarPillKey, { color: tokens.muted }]}>TECH</Text>
                          <Text style={[styles.radarPillVal, { color: tokens.foreground }]}>
                            {lastEval.ratings.technical != null ? lastEval.ratings.technical : '—'}
                          </Text>
                        </View>
                        <View style={styles.radarPillItem}>
                          <Text style={[styles.radarPillKey, { color: tokens.muted }]}>TACT</Text>
                          <Text style={[styles.radarPillVal, { color: tokens.foreground }]}>
                            {lastEval.ratings.tactical != null ? lastEval.ratings.tactical : '—'}
                          </Text>
                        </View>
                        <View style={styles.radarPillItem}>
                          <Text style={[styles.radarPillKey, { color: tokens.muted }]}>PHYS</Text>
                          <Text style={[styles.radarPillVal, { color: tokens.foreground }]}>
                            {lastEval.ratings.physical != null ? lastEval.ratings.physical : '—'}
                          </Text>
                        </View>
                        <View style={styles.radarPillItem}>
                          <Text style={[styles.radarPillKey, { color: tokens.muted }]}>MENT</Text>
                          <Text style={[styles.radarPillVal, { color: tokens.foreground }]}>
                            {lastEval.ratings.mental != null ? lastEval.ratings.mental : '—'}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Appréciations excerpt */}
                    {lastEval?.notes ? (
                      <View style={[styles.notesBox, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                        <Text style={[styles.notesExcerpt, { color: withAlpha(tokens.foreground, 0.85) }]} numberOfLines={2}>
                          « {lastEval.notes} »
                        </Text>
                      </View>
                    ) : null}

                    {/* Objectives summary preview */}
                    <View style={styles.objectivesPreviewRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Feather name="target" size={14} color={tokens.accent} />
                        <Text style={[styles.objCountText, { color: tokens.muted }]}>
                          {playerObjs.length} objectif{playerObjs.length > 1 ? 's' : ''} de saison
                        </Text>
                      </View>
                      {avgProgress != null && (
                        <View style={[styles.avgProgBadge, { backgroundColor: withAlpha(proSemantic.info, 0.15) }]}>
                          <Text style={[styles.avgProgText, { color: proSemantic.info }]}>
                            {avgProgress}% moyen
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Evaluation Action CTA */}
                    <PressableSpring
                      style={[styles.evaluateBtn, { backgroundColor: tokens.accent }]}
                      onPress={() => setEvaluatingPlayer(player)}
                    >
                      <Feather name="clipboard" size={16} color={tokens.bg} />
                      <Text style={[styles.evaluateBtnText, { color: tokens.bg }]}>
                        Évaluer le joueur & Objectifs
                      </Text>
                    </PressableSpring>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* TAB 2: TEAM COLLECTIVE OBJECTIVES */}
        {activeTab === 'team_objectives' && (
          <View style={styles.tabContent}>
            {/* Header banner */}
            <View style={[styles.teamObjBanner, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.teamObjBannerTitle, { color: tokens.foreground }]}>
                  Objectifs Collectifs de l’Équipe
                </Text>
                <Text style={[styles.teamObjBannerSubtitle, { color: tokens.muted }]}>
                  Définissez la feuille de route du groupe pour la saison et pilotez l’avancement.
                </Text>
              </View>

              <PressableSpring
                style={[styles.addTeamObjBtn, { backgroundColor: tokens.accent }]}
                onPress={() => setShowAddTeamObjective((prev) => !prev)}
              >
                <Ionicons name={showAddTeamObjective ? 'close' : 'add'} size={18} color={tokens.bg} />
                <Text style={[styles.addTeamObjBtnText, { color: tokens.bg }]}>
                  {showAddTeamObjective ? 'Annuler' : 'Nouvel Objectif'}
                </Text>
              </PressableSpring>
            </View>

            {/* Inline creation form */}
            {showAddTeamObjective && (
              <View style={[styles.teamObjFormCard, { backgroundColor: tokens.surface, borderColor: tokens.accent }]}>
                <Text style={[styles.formHeaderTitle, { color: tokens.accent }]}>
                  Créer un Objectif Collectif
                </Text>

                <TextInput
                  style={[styles.inputField, { backgroundColor: tokens.elevated, borderColor: tokens.border, color: tokens.foreground }]}
                  placeholder="Intitulé (ex : Finir sur le podium en championnat)"
                  placeholderTextColor={tokens.muted}
                  value={newTeamObjTitle}
                  onChangeText={setNewTeamObjTitle}
                />

                <TextInput
                  style={[styles.textArea, { backgroundColor: tokens.elevated, borderColor: tokens.border, color: tokens.foreground, marginTop: 8 }]}
                  placeholder="Description ou plan d'action de l'équipe (optionnel)"
                  placeholderTextColor={tokens.muted}
                  multiline
                  numberOfLines={2}
                  value={newTeamObjDesc}
                  onChangeText={setNewTeamObjDesc}
                />

                <TextInput
                  style={[styles.inputField, { backgroundColor: tokens.elevated, borderColor: tokens.border, color: tokens.foreground, marginTop: 8 }]}
                  placeholder="Indicateur cible (ex : 45 points, moins de 25 buts encaissés)"
                  placeholderTextColor={tokens.muted}
                  value={newTeamObjTarget}
                  onChangeText={setNewTeamObjTarget}
                />

                {/* Progress Selector */}
                <View style={{ marginTop: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={[styles.inputLabel, { color: tokens.muted }]}>Progression actuelle :</Text>
                    <Text style={{ color: tokens.accent, fontWeight: '700' }}>{newTeamObjProgress}%</Text>
                  </View>
                  <View style={styles.progressPillsRow}>
                    {[0, 25, 50, 75, 100].map((step) => (
                      <PressableSpring
                        key={step}
                        style={[
                          styles.progressPill,
                          newTeamObjProgress === step
                            ? { backgroundColor: tokens.accent, borderColor: tokens.accent }
                            : { backgroundColor: tokens.elevated, borderColor: tokens.border },
                        ]}
                        onPress={() => setNewTeamObjProgress(step)}
                      >
                        <Text
                          style={{
                            color: newTeamObjProgress === step ? tokens.bg : tokens.foreground,
                            fontWeight: '700',
                            fontSize: 12,
                          }}
                        >
                          {step}%
                        </Text>
                      </PressableSpring>
                    ))}
                  </View>
                </View>

                <PressableSpring
                  style={[styles.submitFormBtn, { backgroundColor: tokens.accent }]}
                  onPress={handleCreateTeamObjective}
                  disabled={savingTeamObjective}
                >
                  {savingTeamObjective ? (
                    <ActivityIndicator size="small" color={tokens.bg} />
                  ) : (
                    <Text style={[styles.submitFormBtnText, { color: tokens.bg }]}>
                      Enregistrer l’objectif collectif
                    </Text>
                  )}
                </PressableSpring>
              </View>
            )}

            {/* List of Team Objectives */}
            {teamObjectives.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                <Feather name="target" size={32} color={tokens.muted} />
                <Text style={[styles.emptyTitle, { color: tokens.foreground }]}>
                  Aucun objectif d'équipe défini
                </Text>
                <Text style={[styles.emptySubtitle, { color: tokens.muted }]}>
                  Créez des objectifs collectifs pour fixer le cap de la saison avec vos joueurs.
                </Text>
              </View>
            ) : (
              teamObjectives.map((obj) => (
                <View
                  key={obj.id}
                  style={[styles.teamObjCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                >
                  <View style={styles.teamObjCardHeader}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={[styles.teamObjTitle, { color: tokens.foreground }]}>
                        {obj.title}
                      </Text>
                      {obj.description ? (
                        <Text style={[styles.teamObjDesc, { color: tokens.muted }]}>
                          {obj.description}
                        </Text>
                      ) : null}
                      {obj.target_label ? (
                        <View style={styles.targetLabelRow}>
                          <Ionicons name="flag-outline" size={12} color={tokens.accent} />
                          <Text style={[styles.targetLabelText, { color: tokens.accent }]}>
                            {obj.target_label}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={[styles.teamObjBadge, { backgroundColor: withAlpha(tokens.accent, 0.15) }]}>
                      <Text style={[styles.teamObjBadgeText, { color: tokens.accent }]}>
                        {obj.progress}%
                      </Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={[styles.progressBarBg, { backgroundColor: tokens.elevated }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${obj.progress}%`,
                          backgroundColor: obj.progress === 100 ? proSemantic.success : tokens.accent,
                        },
                      ]}
                    />
                  </View>

                  {/* Progress adjust steppers */}
                  <View style={styles.progressAdjustmentRow}>
                    <Text style={[styles.progressAdjustLabel, { color: tokens.muted }]}>Ajustement :</Text>
                    <View style={styles.progressBtnsGroup}>
                      <PressableSpring
                        style={[styles.progressStepBtn, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
                        onPress={() => handleUpdateTeamObjProgress(obj.id, obj.progress - 10)}
                      >
                        <Text style={[styles.progressStepBtnText, { color: tokens.foreground }]}>-10%</Text>
                      </PressableSpring>
                      <PressableSpring
                        style={[styles.progressStepBtn, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
                        onPress={() => handleUpdateTeamObjProgress(obj.id, obj.progress + 10)}
                      >
                        <Text style={[styles.progressStepBtnText, { color: tokens.foreground }]}>+10%</Text>
                      </PressableSpring>
                      {obj.progress < 100 && (
                        <PressableSpring
                          style={[styles.progressStepBtn, { backgroundColor: withAlpha(proSemantic.success, 0.15), borderColor: proSemantic.success }]}
                          onPress={() => handleUpdateTeamObjProgress(obj.id, 100)}
                        >
                          <Ionicons name="checkmark" size={12} color={proSemantic.success} />
                          <Text style={[styles.progressStepBtnText, { color: proSemantic.success }]}>100%</Text>
                        </PressableSpring>
                      )}
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 3: OPPONENT SCOUTING DATABASE */}
        {activeTab === 'opponents' && (
          <>
            <Text style={[styles.sectionTitle, { color: tokens.foreground }]}>
              Fiches de Veille & Scouting des Prochains Adversaires
            </Text>
            {OPPONENTS_SCOUT.map((opp) => (
              <View key={opp.id} style={[styles.scoutOppCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                <View style={styles.scoutOppTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.scoutOppName, { color: tokens.foreground }]}>{opp.name}</Text>
                    <Text style={[styles.scoutOppRank, { color: tokens.muted }]}>{opp.rank} · {opp.nextMatchDate}</Text>
                  </View>
                  <View style={[styles.systemBadge, { backgroundColor: withAlpha('0A84FF', 0.15) }]}>
                    <Text style={styles.systemBadgeText}>{opp.system}</Text>
                  </View>
                </View>

                <View style={[styles.scoutDetailBox, { backgroundColor: tokens.elevated, borderLeftColor: tokens.accent }]}>
                  <Text style={[styles.scoutDetailLabel, { color: tokens.accent }]}>Joueur Clé / Danger :</Text>
                  <Text style={[styles.scoutDetailVal, { color: tokens.foreground }]}>{opp.dangerPlayer}</Text>
                </View>

                <View style={[styles.scoutDetailBox, { backgroundColor: tokens.elevated, marginTop: 6, borderLeftColor: proSemantic.danger }]}>
                  <Text style={[styles.scoutDetailLabel, { color: proSemantic.danger }]}>Faille Exploitable :</Text>
                  <Text style={[styles.scoutDetailVal, { color: tokens.foreground }]}>{opp.weakness}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* TAB 4: STAFF ENCRYPTED CHANNEL */}
        {activeTab === 'staff_channel' && (
          <View style={[styles.staffChannelCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.staffChannelHeader}>
              <MaterialCommunityIcons name="shield-lock-outline" size={18} color={tokens.accent} />
              <Text style={[styles.staffChannelTitle, { color: tokens.foreground }]}>Canal Sécurisé du Staff Technique</Text>
            </View>
            <Text style={[styles.staffChannelDesc, { color: tokens.muted }]}>
              Échanges confidentiels réservés aux entraîneurs, préparateur physique et staff médical.
            </Text>

            {/* AI Audio Briefing Pill */}
            <View style={[styles.audioBriefPill, { backgroundColor: tokens.elevated, borderColor: withAlpha('0A84FF', 0.25) }]}>
              <MaterialCommunityIcons name="waveform" size={20} color={proSemantic.info} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.audioBriefTitle, { color: tokens.foreground }]}>Brief Hebdomadaire Vocal IA (3 min)</Text>
                <Text style={[styles.audioBriefSub, { color: tokens.muted }]}>Synthèse audio des charges d’entraînement et du plan match</Text>
              </View>
              <TouchableOpacity
                style={styles.playBriefBtn}
                onPress={() => Alert.alert('Lecture du Brief', 'Lecture audio du briefing staff en cours...')}
              >
                <Ionicons name="play" size={16} color={tokens.foreground} />
              </TouchableOpacity>
            </View>

            {/* Chat Messages */}
            <View style={[styles.chatMessage, { backgroundColor: tokens.elevated }]}>
              <Text style={[styles.chatAuthor, { color: tokens.accent }]}>Préparateur Physique · 09:15</Text>
              <Text style={[styles.chatBody, { color: withAlpha(tokens.foreground, 0.85) }]}>
                Lucas M. a ressenti une légère gêne aux ischio-jambiers. Son protocole vélo est validé pour ce soir.
              </Text>
            </View>

            <View style={[styles.chatMessage, { backgroundColor: tokens.elevated }]}>
              <Text style={[styles.chatAuthor, { color: tokens.accent }]}>Entraîneur Adjoint · 10:40</Text>
              <Text style={[styles.chatBody, { color: withAlpha(tokens.foreground, 0.85) }]}>
                Vidéo du match de RC France découpée. Leurs latéraux décrochent dès la 70e minute.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Evaluation Sheet Modal */}
      {evaluatingPlayer && (
        <CoachPlayerEvaluationSheet
          visible={Boolean(evaluatingPlayer)}
          onClose={() => setEvaluatingPlayer(null)}
          player={evaluatingPlayer}
          onSaved={() => {
            void loadAll();
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  badgePsd: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePsdText: {
    color: proSemantic.info,
    fontSize: 9,
    fontWeight: '800',
  },
  badgeCert: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeCertText: {
    fontSize: 9,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  segmentBarScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 12,
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    padding: 24,
    borderRadius: proRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  playerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  playerCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontWeight: '800',
    fontSize: 15,
  },
  playerNameText: {
    fontSize: 14,
    fontWeight: '800',
  },
  tagMini: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagMiniText: {
    fontSize: 9,
    fontWeight: '700',
  },
  playerMetaText: {
    fontSize: 11,
    marginTop: 2,
  },
  overallScoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  overallScoreVal: {
    fontWeight: '800',
    fontSize: 13,
  },
  overallScoreLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  radarPillsRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
    justifyContent: 'space-around',
  },
  radarPillItem: {
    alignItems: 'center',
  },
  radarPillKey: {
    fontSize: 9,
    fontWeight: '700',
  },
  radarPillVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  notesBox: {
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  notesExcerpt: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  objectivesPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  objCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  avgProgBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  avgProgText: {
    fontSize: 10,
    fontWeight: '700',
  },
  evaluateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    minHeight: 44,
    paddingVertical: 10,
  },
  evaluateBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  tabContent: {
    gap: 12,
  },
  teamObjBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 4,
  },
  teamObjBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  teamObjBannerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  addTeamObjBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    minHeight: 44,
  },
  addTeamObjBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  teamObjFormCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  formHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  inputField: {
    borderRadius: proRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: proForm.fieldHeight,
    fontSize: 13,
  },
  textArea: {
    borderRadius: proRadius.md,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressPill: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitFormBtn: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: proRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitFormBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  teamObjCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  teamObjCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  teamObjTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  teamObjDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  targetLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  targetLabelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  teamObjBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  teamObjBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressAdjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressAdjustLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressBtnsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressStepBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  progressStepBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  scoutOppCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  scoutOppTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scoutOppName: {
    fontSize: 14,
    fontWeight: '800',
  },
  scoutOppRank: {
    fontSize: 11,
    marginTop: 2,
  },
  systemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  systemBadgeText: {
    color: proSemantic.info,
    fontSize: 11,
    fontWeight: '700',
  },
  scoutDetailBox: {
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
  },
  scoutDetailLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  scoutDetailVal: {
    fontSize: 11,
    marginTop: 2,
  },
  staffChannelCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  staffChannelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  staffChannelTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  staffChannelDesc: {
    fontSize: 11,
    marginBottom: 14,
  },
  audioBriefPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  audioBriefTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  audioBriefSub: {
    fontSize: 10,
  },
  playBriefBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: proSemantic.info,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatMessage: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  chatAuthor: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  chatBody: {
    fontSize: 11,
    lineHeight: 16,
  },
});
