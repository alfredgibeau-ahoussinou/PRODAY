/**
 * Espace Club › Hub des Classements & Ligues FFF
 * Dual-tab Apple Design :
 * 1. « Mon Club » : Suivi de toutes les équipes du club (Seniors, U19, U17, Féminines...),
 *    sélecteur multi-compétitions (championnat vs coupe), tableau de poule complet avec
 *    optimisation mobile et fiches publiques des adversaires.
 * 2. « Explorer » : Annuaire exhaustif des championnats et clubs FFF de France avec
 *    filtres géographiques (région, district), catégories d'âge et fiches publiques minimales.
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubLeagueId } from '../../features/club/hooks/useClubLeagueId';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubText } from '../../features/club/ui/clubUi';
import { EliteLeagueStandings } from '../../components/matchs/EliteLeagueStandings';
import { clubRadius, clubSpace } from '../../features/club/theme/clubDesignSystem';
import { CLUB_TOKENS, type ClubThemeTokens } from '../../features/club/theme/clubTokens';
import {
  buildCertifiedSeedLeague,
  describeStandingsFreshness,
  frenchFootballStandingsService,
  type FrenchLeagueData,
} from '../../services/frenchFootballStandings.service';
import {
  buildClubTeamsOverviewList,
  isClubStandingRow,
  type ClubTeamOverviewItem,
  type PublicTeamSportingRecord,
} from '../../features/club/ui/clubStandingsModel';
import { ClubTeamStandingsCard } from '../../features/club/ui/ClubTeamStandingsCard';
import { ClubGroupStandingsTable } from '../../features/club/ui/ClubGroupStandingsTable';
import { ClubPublicTeamDetailsModal } from '../../features/club/ui/ClubPublicTeamDetailsModal';
import { ClubDirectoryExplorer } from '../../features/club/ui/ClubDirectoryExplorer';
import { Icon } from '../../components/ui/Icon';
import { PressableSpring } from '../../components/motion';
import { ProDayText } from '../../components/ui/ProDayText';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { LeagueStandingRow } from '../../components/matchs/EliteLeagueStandings';

type StandingsTab = 'mon_club' | 'explorer';
type PoolSubTab = 'classement' | 'buteurs';

export function ClubStandingsScreen() {
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const {
    leagueId: defaultLeagueId,
    teamId: defaultTeamId,
    clubTeamName: defaultTeamName,
    divisionLabel: defaultDivisionLabel,
    groupLabel: defaultGroupLabel,
    season,
    loading: leagueResolutionLoading,
  } = useClubLeagueId();

  const [activeTab, setActiveTab] = useState<StandingsTab>('mon_club');
  const [poolSubTab, setPoolSubTab] = useState<PoolSubTab>('classement');
  const [poolData, setPoolData] = useState<FrenchLeagueData | null>(null);
  const [loadingPool, setLoadingPool] = useState<boolean>(false);
  const [refreshingStandings, setRefreshingStandings] = useState(false);

  // État de sélection d'équipe pour la vue détaillée de poule
  const [selectedTeamForTable, setSelectedTeamForTable] = useState<{
    teamId: string;
    teamName: string;
    leagueId: string;
    divisionLabel: string;
    groupLabel?: string;
  } | null>(null);

  // État des sélections de compétition par équipe (pour le multi-compétition)
  const [teamCompetitionSelections, setTeamCompetitionSelections] = useState<Record<string, string>>({});

  // Fiche publique inspectée (adversaire ou explorée)
  const [publicRecordModal, setPublicRecordModal] = useState<PublicTeamSportingRecord | null>(null);

  // Cache des classements résolus par ligue pour les cartes multi-équipes
  const [teamsOverviewData, setTeamsOverviewData] = useState<Record<string, FrenchLeagueData>>({});

  // État des corrections manuelles systématiques (Page 19)
  const [overrides, setOverrides] = useState<Record<string, {
    points?: number;
    played?: number;
    won?: number;
    drawn?: number;
    lost?: number;
    goal_diff?: number;
    reason?: string;
  }>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOverrideTeamId, setSelectedOverrideTeamId] = useState<string>('');
  const [editPts, setEditPts] = useState('');
  const [editPlayed, setEditPlayed] = useState('');
  const [editWon, setEditWon] = useState('');
  const [editDrawn, setEditDrawn] = useState('');
  const [editLost, setEditLost] = useState('');
  const [editDiff, setEditDiff] = useState('');
  const [editReason, setEditReason] = useState('');

  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const seasonLabel = (season || '2026-2027').replace('-', '/');

  // Construction de la liste des équipes du club
  const clubTeamItems: ClubTeamOverviewItem[] = useMemo(() => {
    const rawList = buildClubTeamsOverviewList(ws.teams, ws.club);
    return rawList.map((item) => {
      const activeCompId = teamCompetitionSelections[item.id] || item.activeCompetitionId;
      const comp = item.competitions.find((c) => c.id === activeCompId) ?? item.competitions[0];
      const isKnockout = Boolean(comp?.isKnockout);

      // Si c'est un championnat avec classement disponible
      const leagueData = teamsOverviewData[activeCompId];
      let rank = item.rank;
      let points = item.points;
      let played = item.played;
      let goalDiff = item.goalDiff;
      let form = item.form;

      if (leagueData && leagueData.standings.length > 0) {
        const found = leagueData.standings.find((row) =>
          isClubStandingRow(row, {
            teamId: item.id,
            fffTeamId: item.fffTeamId,
            teamName: item.teamName,
            clubName: item.clubName,
          }),
        );
        if (found) {
          rank = found.rank;
          points = found.points;
          played = found.played;
          goalDiff = found.goal_diff;
          form = found.form;
        }
      }

      return {
        ...item,
        activeCompetitionId: activeCompId,
        isKnockout,
        rank,
        points,
        played,
        goalDiff,
        form,
        lastSyncAt: leagueData?.lastSyncAt,
      };
    });
  }, [ws.teams, ws.club, teamCompetitionSelections, teamsOverviewData]);

  // Chargement des données de classement pour toutes les compétitions actives des équipes
  useEffect(() => {
    let active = true;
    const compIdsToFetch = new Set<string>();

    const rawList = buildClubTeamsOverviewList(ws.teams, ws.club);
    rawList.forEach((t) => {
      const activeCompId = teamCompetitionSelections[t.id] || t.activeCompetitionId;
      const activeComp = t.competitions.find((c) => c.id === activeCompId) ?? t.competitions[0];
      if (activeComp && !activeComp.isKnockout) {
        compIdsToFetch.add(activeComp.id);
      }
    });

    if (defaultLeagueId) compIdsToFetch.add(defaultLeagueId);

    Promise.all(
      Array.from(compIdsToFetch).map(async (lid) => {
        try {
          const data = await frenchFootballStandingsService.getLeagueStandings(lid, season);
          return { lid, data };
        } catch {
          return { lid, data: null };
        }
      }),
    ).then((results) => {
      if (!active) return;
      setTeamsOverviewData((prev) => {
        let changed = false;
        results.forEach(({ lid, data }) => {
          if (data && prev[lid] !== data) {
            changed = true;
          }
        });
        if (!changed) return prev;
        const next = { ...prev };
        results.forEach(({ lid, data }) => {
          if (data) next[lid] = data;
        });
        return next;
      });
    });

    return () => {
      active = false;
    };
  }, [ws.teams, ws.club, teamCompetitionSelections, defaultLeagueId, season]);

  // Ligue active pour le tableau de poule affiché
  const activeLeagueId = selectedTeamForTable?.leagueId || defaultLeagueId || null;

  // Charge les données de la poule affichée
  const loadPool = useCallback(async () => {
    if (!activeLeagueId) {
      setPoolData(null);
      setLoadingPool(false);
      return;
    }
    setLoadingPool(true);
    setPoolData(buildCertifiedSeedLeague(activeLeagueId, season));
    try {
      const data = await frenchFootballStandingsService.getLeagueStandings(activeLeagueId, season);
      if (data) setPoolData(data);
    } catch {
      // Source injoignable : le shell vide honnête reste affiché
    } finally {
      setLoadingPool(false);
    }
  }, [activeLeagueId, season]);

  useEffect(() => {
    void loadPool();
  }, [loadPool]);

  // Rafraîchissement manuel
  const refreshStandings = async () => {
    if (refreshingStandings) return;
    setRefreshingStandings(true);
    try {
      const result = await frenchFootballStandingsService.refreshNow();
      await loadPool();
      if (result.updated === 0) {
        Alert.alert(
          'Synchronisation',
          'La source n’a publié aucune mise à jour : le classement précédent est conservé avec son horodatage.',
        );
      }
    } catch (e) {
      Alert.alert('Synchronisation FFF', e instanceof Error ? e.message : 'Rafraîchissement impossible.');
    } finally {
      setRefreshingStandings(false);
    }
  };

  // Calcul du classement effectif intégrant les corrections manuelles (Page 19)
  const effectiveStandings = useMemo(() => {
    if (!poolData?.standings) return [];
    const base = poolData.standings.map((team) => {
      const ov = overrides[team.team_id];
      if (!ov) return { ...team, isOverridden: false };
      return {
        ...team,
        points: ov.points !== undefined ? ov.points : team.points,
        played: ov.played !== undefined ? ov.played : team.played,
        won: ov.won !== undefined ? ov.won : team.won,
        drawn: ov.drawn !== undefined ? ov.drawn : team.drawn,
        lost: ov.lost !== undefined ? ov.lost : team.lost,
        goal_diff: ov.goal_diff !== undefined ? ov.goal_diff : team.goal_diff,
        overrideReason: ov.reason,
        isOverridden: true,
      };
    });

    // Si aucune contestation/modification manuelle n'est active, conserver STRICTEMENT
    // les rangs officiels publiés par la FFF (règle : ne jamais recalculer les places par points seuls).
    if (Object.keys(overrides).length === 0) {
      return base;
    }

    base.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.goal_diff - a.goal_diff;
    });

    return base.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [poolData?.standings, overrides]);

  const hasOverrides = Object.keys(overrides).length > 0;
  const freshness = useMemo(() => describeStandingsFreshness(poolData), [poolData]);

  if (ws.loading || leagueResolutionLoading) {
    return (
      <View style={[styles.root, styles.centerFlex]}>
        <ActivityIndicator size="large" color={tokens.accent} />
        <ClubText variant="caption" muted style={styles.loadingText}>
          Chargement des championnats officiels du club…
        </ClubText>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* 1. Brand Header */}
      <View style={styles.headerPad}>
        <ClubBrandHeader
          title="Classements & Ligues"
          subtitle={`Saison ${seasonLabel} · Compétitions Officielles FFF`}
        />

        {/* 2. Apple Segmented Control : Mon Club vs Explorer */}
        <View style={styles.segmentedContainer}>
          <PressableSpring
            onPress={() => {
              prodayHaptics.tabSwitch();
              setActiveTab('mon_club');
            }}
            style={[
              styles.segmentedTab,
              activeTab === 'mon_club' && styles.segmentedTabActive,
            ]}
            scaleTo={0.98}
          >
            <Icon
              name="shield"
              size={15}
              color={activeTab === 'mon_club' ? tokens.accent : tokens.muted}
            />
            <ProDayText
              style={[
                styles.segmentedTabText,
                { color: activeTab === 'mon_club' ? tokens.accent : tokens.muted },
              ]}
            >
              Mon Club ({clubTeamItems.length} équipes)
            </ProDayText>
          </PressableSpring>

          <PressableSpring
            onPress={() => {
              prodayHaptics.tabSwitch();
              setActiveTab('explorer');
            }}
            style={[
              styles.segmentedTab,
              activeTab === 'explorer' && styles.segmentedTabActive,
            ]}
            scaleTo={0.98}
          >
            <Icon
              name="globe"
              size={15}
              color={activeTab === 'explorer' ? tokens.accent : tokens.muted}
            />
            <ProDayText
              style={[
                styles.segmentedTabText,
                { color: activeTab === 'explorer' ? tokens.accent : tokens.muted },
              ]}
            >
              Explorer les Ligues
            </ProDayText>
          </PressableSpring>
        </View>
      </View>

      {/* 3. ONGLET 1 : MON CLUB (MULTI-ÉQUIPES & POULE DÉTAILLÉE) */}
      {activeTab === 'mon_club' ? (
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
        >
          {/* BARRE STATUT SYNCHRO FFF & CORRECTION MANUELLE (Page 19) */}
          <View style={[styles.syncStatusBar, { backgroundColor: CLUB_TOKENS.surface, borderColor: tokens.border }]}>
            <View style={styles.syncStatusLeft}>
              <View style={[styles.syncStatusIndicator, { backgroundColor: freshness.color }]} />
              <View style={{ flex: 1 }}>
                <ProDayText style={[styles.syncStatusTitle, { color: tokens.foreground }]}>
                  {hasOverrides ? 'Correction Manuelle Active' : freshness.label}
                </ProDayText>
                <ProDayText style={[styles.syncStatusSubtitle, { color: tokens.muted }]}>
                  {hasOverrides
                    ? `${Object.keys(overrides).length} club(s) corrigé(s) manuellement · ${freshness.detail}`
                    : `Sync auto toutes les 3 h · ${freshness.detail}`}
                </ProDayText>
              </View>
            </View>

            <View style={styles.syncStatusActions}>
              <PressableSpring
                onPress={() => void refreshStandings()}
                disabled={refreshingStandings}
                scaleTo={0.96}
                style={[styles.resetSyncBtn, { borderColor: tokens.border, opacity: refreshingStandings ? 0.6 : 1 }]}
              >
                <ProDayText style={styles.resetSyncBtnText}>
                  {refreshingStandings ? 'Synchro…' : 'Actualiser'}
                </ProDayText>
              </PressableSpring>

              <PressableSpring
                onPress={() => {
                  const initialTeam = effectiveStandings[0]?.team_id || '';
                  setSelectedOverrideTeamId(initialTeam);
                  const ov = overrides[initialTeam];
                  const st = effectiveStandings.find((s) => s.team_id === initialTeam);
                  setEditPts(String(ov?.points ?? st?.points ?? ''));
                  setEditPlayed(String(ov?.played ?? st?.played ?? ''));
                  setEditWon(String(ov?.won ?? st?.won ?? ''));
                  setEditDrawn(String(ov?.drawn ?? st?.drawn ?? ''));
                  setEditLost(String(ov?.lost ?? st?.lost ?? ''));
                  setEditDiff(String(ov?.goal_diff ?? st?.goal_diff ?? ''));
                  setEditReason(ov?.reason ?? '');
                  setModalVisible(true);
                }}
                style={[styles.manualCorrectionBtn, { backgroundColor: tokens.accent }]}
                scaleTo={0.96}
              >
                <Icon name="tune" size={13} color="#000000" />
                <ProDayText style={styles.manualCorrectionBtnText}>
                  Ajuster
                </ProDayText>
              </PressableSpring>
            </View>
          </View>

          {/* VUE 1.A : VUE DÉTAILLÉE D'UNE POULE SPÉCIFIQUE (SI UNE ÉQUIPE EST SÉLECTIONNÉE) */}
          {selectedTeamForTable ? (
            <ClubGroupStandingsTable
              standings={effectiveStandings}
              divisionLabel={selectedTeamForTable.divisionLabel || poolData?.divisionLabel || 'Championnat FFF'}
              groupLabel={selectedTeamForTable.groupLabel || poolData?.groupLabel || poolData?.name}
              season={poolData?.season || season}
              phase={poolData?.phase}
              sourceUrl={poolData?.sourceUrl}
              verificationStatus={poolData?.verificationStatus ?? (poolData?.standings?.length ? 'verified' : 'unverified')}
              freshnessLabel={freshness.ageLabel ? `il y a ${freshness.ageLabel}` : undefined}
              highlightTeamId={selectedTeamForTable.teamId}
              highlightTeamName={selectedTeamForTable.teamName}
              tokens={tokens}
              onBackToTeams={() => {
                setSelectedTeamForTable(null);
              }}
              onSelectOpponent={(row) => {
                setPublicRecordModal({
                  clubId: row.team_id,
                  clubName: row.name,
                  teamName: row.name,
                  category: selectedTeamForTable.teamName.includes('U19') ? 'U19' : 'Seniors',
                  competitionName: selectedTeamForTable.divisionLabel || poolData?.name || 'Championnat FFF',
                  divisionLabel: selectedTeamForTable.divisionLabel || poolData?.divisionLabel || '',
                  groupLabel: selectedTeamForTable.groupLabel,
                  rank: row.rank,
                  points: row.points,
                  played: row.played,
                  won: row.won,
                  drawn: row.drawn,
                  lost: row.lost,
                  goalsFor: row.goals_for,
                  goalsAgainst: row.goals_against,
                  goalDiff: row.goal_diff,
                  form: row.form,
                  source: poolData?.source ?? 'FFF DOFA Officiel',
                  lastSyncAt: poolData?.lastSyncAt,
                });
              }}
            />
          ) : (
            /* VUE 1.B : VUE D'ENSEMBLE DE TOUTES LES ÉQUIPES DU CLUB (MON CLUB OVERVIEW) */
            <View style={styles.teamsOverviewContainer}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <ProDayText style={[styles.sectionTitle, { color: tokens.foreground }]}>
                    Toutes les Équipes du Club
                  </ProDayText>
                  <ProDayText style={[styles.sectionSub, { color: tokens.muted }]}>
                    Sélectionnez une équipe pour ouvrir son classement de poule officiel
                  </ProDayText>
                </View>
              </View>

              {clubTeamItems.map((item) => (
                <ClubTeamStandingsCard
                  key={item.id}
                  item={item}
                  tokens={tokens}
                  onSelectTeam={(teamId, compId) => {
                    const comp = item.competitions.find((c) => c.id === compId) ?? item.competitions[0];
                    setSelectedTeamForTable({
                      teamId: item.fffTeamId || item.id,
                      teamName: item.teamName,
                      leagueId: comp.id,
                      divisionLabel: comp.divisionLabel,
                      groupLabel: comp.groupLabel,
                    });
                  }}
                  onSelectCompetition={(teamId, compId) => {
                    setTeamCompetitionSelections((prev) => ({
                      ...prev,
                      [teamId]: compId,
                    }));
                  }}
                />
              ))}

              {/* TABLEAU COMPLET DE LA POULE OFFICIELLE DU CLUB */}
              {poolData && poolData.standings.length > 0 ? (
                <View style={{ marginTop: clubSpace.md, marginBottom: clubSpace.md }}>
                  <ClubGroupStandingsTable
                    standings={effectiveStandings}
                    divisionLabel={poolData.divisionLabel || poolData.name}
                    groupLabel={poolData.groupLabel || poolData.name}
                    season={poolData.season}
                    phase={poolData.phase}
                    sourceUrl={poolData.sourceUrl}
                    verificationStatus={poolData.verificationStatus ?? 'verified'}
                    freshnessLabel={freshness.ageLabel ? `il y a ${freshness.ageLabel}` : undefined}
                    highlightTeamId={defaultTeamId || (clubTeamItems[0]?.fffTeamId ?? clubTeamItems[0]?.id)}
                    highlightTeamName={defaultTeamName || clubTeamItems[0]?.teamName}
                    tokens={tokens}
                    onSelectOpponent={(row) => {
                      setPublicRecordModal({
                        clubId: row.team_id,
                        clubName: row.name,
                        teamName: row.name,
                        category: defaultTeamName?.includes('U19') ? 'U19' : 'Seniors',
                        competitionName: poolData.name || 'Championnat FFF',
                        divisionLabel: poolData.divisionLabel || '',
                        rank: row.rank,
                        points: row.points,
                        played: row.played,
                        won: row.won,
                        drawn: row.drawn,
                        lost: row.lost,
                        goalsFor: row.goals_for,
                        goalsAgainst: row.goals_against,
                        goalDiff: row.goal_diff,
                        form: row.form,
                        source: poolData.source ?? 'FFF Officiel',
                        lastSyncAt: poolData.lastSyncAt,
                      });
                    }}
                  />
                </View>
              ) : null}

              {/* COMMUTATEUR SOUS-ONGLET BUTEURS DE LA POULE PRINCIPALE */}
              <View style={[styles.scorersCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                <View style={[styles.scorersHeader, { borderBottomColor: tokens.border }]}>
                  <Icon name="trophy" size={16} color={tokens.accent} />
                  <ProDayText style={[styles.scorersTitle, { color: tokens.foreground }]}>
                    Buteurs de Référence · Seniors R1
                  </ProDayText>
                </View>

                {(poolData?.scorers ?? []).length === 0 ? (
                  <ProDayText style={[styles.honestNote, { color: tokens.muted }]}>
                    Aucun buteur enregistré pour cette compétition officielle.
                  </ProDayText>
                ) : null}

                {(poolData?.scorers ?? []).slice(0, 5).map((scorer) => {
                  return (
                    <View key={scorer.rank} style={[styles.scorerRow, { borderBottomColor: tokens.border }]}>
                      <View style={[styles.scorerRankBadge, { backgroundColor: tokens.elevated }]}>
                        <ProDayText style={[styles.scorerRankNum, { color: tokens.accent }]}>
                          {scorer.rank}
                        </ProDayText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <ProDayText style={[styles.scorerName, { color: tokens.foreground }]}>
                          {scorer.name}
                        </ProDayText>
                        <ProDayText style={[styles.scorerClub, { color: tokens.muted }]}>
                          {scorer.club}
                        </ProDayText>
                      </View>
                      <View style={styles.scorerStats}>
                        <ProDayText style={[styles.scorerGoalsNum, { color: tokens.accent }]}>
                          {scorer.goals}
                        </ProDayText>
                        <ProDayText style={[styles.scorerGoalsLabel, { color: tokens.muted }]}>
                          buts
                        </ProDayText>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* BANNIÈRE DE TRANSITION VERS L'EXPLORATEUR */}
              <PressableSpring
                onPress={() => {
                  prodayHaptics.press();
                  setActiveTab('explorer');
                }}
                style={[styles.exploreBanner, { backgroundColor: tokens.surface, borderColor: `${tokens.accent}40` }]}
                scaleTo={0.98}
              >
                <View style={styles.exploreBannerLeft}>
                  <Icon name="globe" size={22} color={tokens.accent} />
                  <View style={{ flex: 1 }}>
                    <ProDayText style={[styles.exploreBannerTitle, { color: tokens.foreground }]}>
                      Explorer les autres clubs et championnats
                    </ProDayText>
                    <ProDayText style={[styles.exploreBannerSub, { color: tokens.muted }]}>
                      Recherche par région (IDF, PACA, Auvergne...), district (92, 93, 75...) et catégorie
                    </ProDayText>
                  </View>
                </View>
                <Icon name="chevron-forward" size={18} color={tokens.accent} />
              </PressableSpring>
            </View>
          )}
        </ScrollView>
      ) : (
        /* 4. ONGLET 2 : EXPLORATEUR GLOBAL DES CLUBS & COMPÉTITIONS FFF */
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <ClubDirectoryExplorer
            tokens={tokens}
            onSelectTeamStandings={(leagueId, teamName) => {
              setActiveTab('mon_club');
              setSelectedTeamForTable({
                teamId: '',
                teamName,
                leagueId,
                divisionLabel: 'Championnat FFF',
              });
            }}
            onInspectPublicRecord={(record) => {
              setPublicRecordModal(record);
            }}
          />
        </ScrollView>
      )}

      {/* MODAL FICHE PUBLIQUE D'ÉQUIPE (ADVERSAIRE OU EXPLORÉE) */}
      <ClubPublicTeamDetailsModal
        visible={publicRecordModal != null}
        record={publicRecordModal}
        tokens={tokens}
        onClose={() => setPublicRecordModal(null)}
        onOpenStandings={() => {
          if (!publicRecordModal) return;
          setActiveTab('mon_club');
          setSelectedTeamForTable({
            teamId: publicRecordModal.clubId || '',
            teamName: publicRecordModal.teamName,
            leagueId: defaultLeagueId || 'r1_idf_b',
            divisionLabel: publicRecordModal.competitionName,
            groupLabel: publicRecordModal.groupLabel,
          });
          setPublicRecordModal(null);
        }}
      />

      {/* MODAL CORRECTION MANUELLE DU CLASSEMENT (Page 19) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[styles.modalBox, { backgroundColor: CLUB_TOKENS.surface, borderColor: tokens.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <ProDayText style={[styles.modalTitle, { color: tokens.foreground }]}>
                  Correction Manuelle du Classement
                </ProDayText>
                <ProDayText style={[styles.modalSubtitle, { color: tokens.muted }]}>
                  Ajustement administratif & pénalités FFF
                </ProDayText>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
              >
                <Icon name="close" size={22} color={tokens.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              {/* Sélecteur d'équipe */}
              <ProDayText style={[styles.fieldLabel, { color: tokens.muted }]}>
                Équipe à corriger
              </ProDayText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {effectiveStandings.map((st) => (
                  <TouchableOpacity
                    key={st.team_id}
                    onPress={() => {
                      setSelectedOverrideTeamId(st.team_id);
                      const ov = overrides[st.team_id];
                      setEditPts(String(ov?.points ?? st.points));
                      setEditPlayed(String(ov?.played ?? st.played));
                      setEditWon(String(ov?.won ?? st.won));
                      setEditDrawn(String(ov?.drawn ?? st.drawn));
                      setEditLost(String(ov?.lost ?? st.lost));
                      setEditDiff(String(ov?.goal_diff ?? st.goal_diff));
                      setEditReason(ov?.reason ?? '');
                    }}
                    style={[
                      styles.teamPickPill,
                      selectedOverrideTeamId === st.team_id
                        ? { backgroundColor: tokens.accent, borderColor: tokens.accent }
                        : { backgroundColor: CLUB_TOKENS.elevated, borderColor: tokens.border },
                    ]}
                  >
                    <ProDayText
                      style={[
                        styles.teamPickText,
                        selectedOverrideTeamId === st.team_id
                          ? { color: '#000000', fontWeight: '700' }
                          : { color: tokens.muted },
                      ]}
                    >
                      {st.name}
                    </ProDayText>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Ligne Points & Diff */}
              <View style={styles.formRowFields}>
                <View style={styles.formCol}>
                  <ProDayText style={[styles.fieldLabel, { color: tokens.muted }]}>Points</ProDayText>
                  <TextInput
                    value={editPts}
                    onChangeText={setEditPts}
                    keyboardType="numeric"
                    style={[styles.modalInput, { color: tokens.foreground, borderColor: tokens.border }]}
                  />
                </View>
                <View style={styles.formCol}>
                  <ProDayText style={[styles.fieldLabel, { color: tokens.muted }]}>Différence</ProDayText>
                  <TextInput
                    value={editDiff}
                    onChangeText={setEditDiff}
                    keyboardType="numeric"
                    style={[styles.modalInput, { color: tokens.foreground, borderColor: tokens.border }]}
                  />
                </View>
              </View>

              {/* Ligne Matchs, V, N, D */}
              <View style={styles.formRowFields}>
                <View style={styles.formCol}>
                  <ProDayText style={[styles.fieldLabel, { color: tokens.muted }]}>Joués</ProDayText>
                  <TextInput
                    value={editPlayed}
                    onChangeText={setEditPlayed}
                    keyboardType="numeric"
                    style={[styles.modalInput, { color: tokens.foreground, borderColor: tokens.border }]}
                  />
                </View>
                <View style={styles.formCol}>
                  <ProDayText style={[styles.fieldLabel, { color: tokens.muted }]}>V</ProDayText>
                  <TextInput
                    value={editWon}
                    onChangeText={setEditWon}
                    keyboardType="numeric"
                    style={[styles.modalInput, { color: tokens.foreground, borderColor: tokens.border }]}
                  />
                </View>
                <View style={styles.formCol}>
                  <ProDayText style={[styles.fieldLabel, { color: tokens.muted }]}>N</ProDayText>
                  <TextInput
                    value={editDrawn}
                    onChangeText={setEditDrawn}
                    keyboardType="numeric"
                    style={[styles.modalInput, { color: tokens.foreground, borderColor: tokens.border }]}
                  />
                </View>
                <View style={styles.formCol}>
                  <ProDayText style={[styles.fieldLabel, { color: tokens.muted }]}>D</ProDayText>
                  <TextInput
                    value={editLost}
                    onChangeText={setEditLost}
                    keyboardType="numeric"
                    style={[styles.modalInput, { color: tokens.foreground, borderColor: tokens.border }]}
                  />
                </View>
              </View>

              {/* Motif de correction */}
              <View style={{ marginTop: 10 }}>
                <ProDayText style={[styles.fieldLabel, { color: tokens.muted }]}>
                  Motif de l'ajustement (ex: Pénalité FFF, forfait...)
                </ProDayText>
                <TextInput
                  value={editReason}
                  onChangeText={setEditReason}
                  placeholder="Ex: -1 point suite à commission de discipline FFF"
                  placeholderTextColor={tokens.muted}
                  style={[styles.modalInput, { color: tokens.foreground, borderColor: tokens.border }]}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActionsRow}>
              {overrides[selectedOverrideTeamId] ? (
                <TouchableOpacity
                  onPress={() => {
                    const next = { ...overrides };
                    delete next[selectedOverrideTeamId];
                    setOverrides(next);
                    setModalVisible(false);
                  }}
                  style={[styles.deleteOverrideBtn, { borderColor: '#EF4444' }]}
                >
                  <ProDayText style={styles.deleteOverrideText}>Supprimer</ProDayText>
                </TouchableOpacity>
              ) : null}

              <PressableSpring
                onPress={() => {
                  if (!selectedOverrideTeamId) return;
                  const ptsNum = parseInt(editPts, 10);
                  const playedNum = parseInt(editPlayed, 10);
                  const wonNum = parseInt(editWon, 10);
                  const drawnNum = parseInt(editDrawn, 10);
                  const lostNum = parseInt(editLost, 10);
                  const diffNum = parseInt(editDiff, 10);

                  setOverrides((prev) => ({
                    ...prev,
                    [selectedOverrideTeamId]: {
                      points: !isNaN(ptsNum) ? ptsNum : undefined,
                      played: !isNaN(playedNum) ? playedNum : undefined,
                      won: !isNaN(wonNum) ? wonNum : undefined,
                      drawn: !isNaN(drawnNum) ? drawnNum : undefined,
                      lost: !isNaN(lostNum) ? lostNum : undefined,
                      goal_diff: !isNaN(diffNum) ? diffNum : undefined,
                      reason: editReason.trim() || undefined,
                    },
                  }));
                  setModalVisible(false);
                }}
                style={[styles.saveOverrideBtn, { backgroundColor: tokens.accent }]}
                scaleTo={0.96}
              >
                <ProDayText style={styles.saveOverrideBtnText}>Appliquer</ProDayText>
              </PressableSpring>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(tokens: ClubThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    centerFlex: { alignItems: 'center', justifyContent: 'center', gap: clubSpace.md },
    loadingText: { marginTop: clubSpace.sm },
    headerPad: {
      paddingHorizontal: clubSpace.lg,
      paddingTop: clubSpace.sm,
      paddingBottom: clubSpace.xs,
    },
    scrollBody: {
      paddingBottom: clubSpace.xxxl,
      paddingHorizontal: clubSpace.lg,
    },

    // Apple Segmented Control
    segmentedContainer: {
      flexDirection: 'row',
      backgroundColor: tokens.surface,
      borderRadius: clubRadius.pill,
      padding: 3,
      marginVertical: clubSpace.md,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    segmentedTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: clubRadius.pill,
      gap: 6,
    },
    segmentedTabActive: {
      backgroundColor: tokens.elevated,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    segmentedTabText: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: -0.2,
    },

    // Barre Statut Synchro FFF (Page 19)
    syncStatusBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: clubRadius.md,
      borderWidth: 1,
      marginBottom: 12,
      gap: 10,
    },
    syncStatusLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    syncStatusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    syncStatusTitle: {
      fontSize: 13,
      fontWeight: '700',
    },
    syncStatusSubtitle: {
      fontSize: 11,
      marginTop: 1,
    },
    syncStatusActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    resetSyncBtn: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
    },
    resetSyncBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: tokens.muted,
    },
    manualCorrectionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    manualCorrectionBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#000000',
    },

    // Section Mon Club Overview
    teamsOverviewContainer: {
      gap: 10,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
    },
    sectionSub: {
      fontSize: 12,
      marginTop: 2,
    },

    // Buteurs
    scorersCard: {
      borderRadius: clubRadius.md,
      borderWidth: 1,
      overflow: 'hidden',
      marginTop: 6,
      marginBottom: 12,
    },
    scorersHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderBottomWidth: 1,
      backgroundColor: tokens.elevated,
    },
    scorersTitle: {
      fontSize: 13,
      fontWeight: '800',
    },
    honestNote: {
      fontSize: 12,
      fontStyle: 'italic',
      padding: 12,
    },
    scorerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
    },
    scorerRankBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    scorerRankNum: {
      fontSize: 12,
      fontWeight: '800',
    },
    scorerName: {
      fontSize: 13,
      fontWeight: '700',
    },
    scorerClub: {
      fontSize: 11,
      marginTop: 1,
    },
    scorerStats: {
      alignItems: 'flex-end',
    },
    scorerGoalsNum: {
      fontSize: 16,
      fontWeight: '900',
    },
    scorerGoalsLabel: {
      fontSize: 10,
      fontWeight: '600',
    },

    // Bannière transition
    exploreBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: clubRadius.md,
      borderWidth: 1,
      padding: clubSpace.md,
      gap: clubSpace.sm,
      marginTop: 4,
    },
    exploreBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
      flex: 1,
    },
    exploreBannerTitle: {
      fontSize: 14,
      fontWeight: '800',
    },
    exploreBannerSub: {
      fontSize: 11,
      marginTop: 2,
    },

    // Modal Correction Manuelle
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalBox: {
      width: '100%',
      maxWidth: 480,
      maxHeight: '85%',
      borderRadius: 20,
      borderWidth: 1,
      padding: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
    },
    modalSubtitle: {
      fontSize: 12,
      marginTop: 2,
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    modalInput: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 14,
      backgroundColor: CLUB_TOKENS.elevated,
    },
    teamPickPill: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      marginRight: 6,
    },
    teamPickText: {
      fontSize: 12,
    },
    formRowFields: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    formCol: {
      flex: 1,
    },
    modalActionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 10,
      marginTop: 16,
    },
    deleteOverrideBtn: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
    },
    deleteOverrideText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#EF4444',
    },
    saveOverrideBtn: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
    },
    saveOverrideBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#000000',
    },
  });
}
