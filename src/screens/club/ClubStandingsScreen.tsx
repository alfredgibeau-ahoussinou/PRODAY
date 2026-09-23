/**
 * Espace Club › Hub des Classements FFF
 * Dual-tab Apple Design :
 * 1. « Notre Poule · FC ProDay (R1 Poule B) » : classement complet officiel, buteurs, forme & règles FFF
 * 2. « Toutes les Ligues de France » : explorateur exhaustif L1, L2, N1, N2, N3, Régionaux IDF & Districts
 */
import React, { useEffect, useMemo, useState } from 'react';
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
import { Icon } from '../../components/ui/Icon';
import { PressableSpring } from '../../components/motion';
import { ProDayText } from '../../components/ui/ProDayText';
import { prodayHaptics } from '../../utils/prodayHaptics';

type StandingsTab = 'notre_poule' | 'toutes_ligues';
type PoolSubTab = 'classement' | 'buteurs';

export function ClubStandingsScreen() {
  const { tokens } = useClubTheme();
  const {
    leagueId,
    teamId,
    clubTeamName,
    divisionLabel,
    groupLabel,
    season,
    loading,
  } = useClubLeagueId();

  const [activeTab, setActiveTab] = useState<StandingsTab>('notre_poule');
  const [poolSubTab, setPoolSubTab] = useState<PoolSubTab>('classement');
  const [poolData, setPoolData] = useState<FrenchLeagueData | null>(null);
  const [loadingPool, setLoadingPool] = useState<boolean>(false);
  const [refreshingStandings, setRefreshingStandings] = useState(false);

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
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [editPts, setEditPts] = useState('');
  const [editPlayed, setEditPlayed] = useState('');
  const [editWon, setEditWon] = useState('');
  const [editDrawn, setEditDrawn] = useState('');
  const [editLost, setEditLost] = useState('');
  const [editDiff, setEditDiff] = useState('');
  const [editReason, setEditReason] = useState('');

  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const effectiveTeamName = clubTeamName;
  const seasonLabel = (season || '2026-2027').replace('-', '/');
  const freshness = useMemo(() => describeStandingsFreshness(poolData), [poolData]);

  /** Charge (sans état local intermédiaire) le classement de la poule. */
  const loadPool = React.useCallback(async () => {
    if (!leagueId) {
      setPoolData(null);
      setLoadingPool(false);
      return;
    }
    setLoadingPool(true);
    setPoolData(buildCertifiedSeedLeague(leagueId, season));
    try {
      const data = await frenchFootballStandingsService.getLeagueStandings(leagueId, season);
      if (data) setPoolData(data);
    } catch {
      // Source injoignable : le shell vide honnête reste affiché
    } finally {
      setLoadingPool(false);
    }
  }, [leagueId, season]);

  /**
   * Rafraîchissement manuel autorisé (admin) — la Cloud Function applique son
   * propre rate limiting (15 min) et un verrou anti-chevauchement ; on remonte
   * son message tel quel plutôt que d'afficher un faux « à jour ».
   */
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

  // Chargement officiel des données de la poule du club
  useEffect(() => {
    void loadPool();
  }, [loadPool]);

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

  if (loading) {
    return (
      <View style={[styles.root, styles.centerFlex]}>
        <ActivityIndicator size="large" color={tokens.accent} />
        <ClubText variant="caption" muted style={styles.loadingText}>
          Chargement de votre championnat officiel…
        </ClubText>
      </View>
    );
  }

  // Équipe du club dans le classement — uniquement par rattachement explicite.
  // Jamais de repli silencieux sur la première ligne (ancien comportement trompeur).
  const myTeamRow = effectiveStandings.find(
    (row) =>
      row.isMyTeam ||
      (teamId != null && row.team_id === teamId) ||
      (effectiveTeamName != null &&
        effectiveTeamName.trim().length > 0 &&
        row.name.toLowerCase().includes(effectiveTeamName.toLowerCase())),
  ) ?? null;

  return (
    <View style={styles.root}>
      {/* 1. Brand Header */}
      <View style={styles.headerPad}>
        <ClubBrandHeader
          title="Classements & Ligues"
          subtitle={`Saison ${seasonLabel} · Compétitions Officielles FFF`}
        />

        {/* 2. Apple Segmented Control */}
        <View style={styles.segmentedContainer}>
          <PressableSpring
            onPress={() => {
              prodayHaptics.tabSwitch();
              setActiveTab('notre_poule');
            }}
            style={[
              styles.segmentedTab,
              activeTab === 'notre_poule' && styles.segmentedTabActive,
            ]}
            scaleTo={0.98}
          >
            <Icon
              name="trophy"
              size={15}
              color={activeTab === 'notre_poule' ? tokens.accent : tokens.muted}
            />
            <ProDayText
              style={[
                styles.segmentedTabText,
                { color: activeTab === 'notre_poule' ? tokens.accent : tokens.muted },
              ]}
            >
              Notre Poule · R1 B
            </ProDayText>
          </PressableSpring>

          <PressableSpring
            onPress={() => {
              prodayHaptics.tabSwitch();
              setActiveTab('toutes_ligues');
            }}
            style={[
              styles.segmentedTab,
              activeTab === 'toutes_ligues' && styles.segmentedTabActive,
            ]}
            scaleTo={0.98}
          >
            <Icon
              name="football"
              size={15}
              color={activeTab === 'toutes_ligues' ? tokens.accent : tokens.muted}
            />
            <ProDayText
              style={[
                styles.segmentedTabText,
                { color: activeTab === 'toutes_ligues' ? tokens.accent : tokens.muted },
              ]}
            >
              Toutes les Ligues
            </ProDayText>
          </PressableSpring>
        </View>
      </View>

      {/* 3. VUE ONGLET 1 : NOTRE POULE (FC PRODAY) */}
      {activeTab === 'notre_poule' ? (
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
                {freshness.isStale && !hasOverrides ? (
                  <ProDayText style={[styles.syncStatusWarn, { color: '#F59E0B' }]}>
                    Données conservées telles quelles : jamais présentées comme fraîchement synchronisées.
                  </ProDayText>
                ) : null}
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

              {hasOverrides ? (
                <TouchableOpacity
                  onPress={() => {
                    setOverrides({});
                    Alert.alert('Réinitialisation', 'Le classement officiel FFF synchronisé a été rétabli.');
                  }}
                  style={[styles.resetSyncBtn, { borderColor: tokens.border }]}
                >
                  <ProDayText style={styles.resetSyncBtnText}>Rétablir FFF</ProDayText>
                </TouchableOpacity>
              ) : null}

              <PressableSpring
                onPress={() => {
                  const initialTeam = effectiveStandings[0]?.team_id || '';
                  setSelectedTeamId(initialTeam);
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

          {/* HERO CARD DU CLUB */}
          <View style={styles.heroClubCard}>
            <View style={styles.heroClubTop}>
              <View style={styles.heroBadgeBox}>
                <Icon name="shield" size={13} color={tokens.accent} />
                <ProDayText style={styles.heroBadgeText}>
                  {divisionLabel || poolData?.divisionLabel || 'Compétition non rattachée'}
                </ProDayText>
              </View>
              <View style={styles.promotionPill}>
                <ProDayText style={styles.promotionPillText}>
                  {myTeamRow
                    ? myTeamRow.rank === 1
                      ? '1er du championnat'
                      : `${myTeamRow.rank}e du championnat`
                    : 'Classement non disponible'}
                </ProDayText>
              </View>
            </View>

            <View style={styles.heroClubMiddle}>
              <View>
                <ProDayText style={styles.heroClubName}>{effectiveTeamName}</ProDayText>
                <ProDayText style={styles.heroClubSub}>
                  {groupLabel || 'Poule à confirmer'}
                </ProDayText>
              </View>
              <View style={styles.heroPointsBox}>
                <ProDayText style={styles.heroPointsNum}>
                  {myTeamRow?.points ?? '—'}
                </ProDayText>
                <ProDayText style={styles.heroPointsLabel}>POINTS</ProDayText>
              </View>
            </View>

            {/* Quick Stat Strip */}
            <View style={styles.statStrip}>
              <View style={styles.statStripItem}>
                <ProDayText style={styles.statStripNum}>{myTeamRow?.played ?? '—'}</ProDayText>
                <ProDayText style={styles.statStripLabel}>Matchs</ProDayText>
              </View>
              <View style={styles.statStripItem}>
                <ProDayText style={[styles.statStripNum, { color: '#10B981' }]}>
                  {myTeamRow?.won ?? '—'}
                </ProDayText>
                <ProDayText style={styles.statStripLabel}>Victoires</ProDayText>
              </View>
              <View style={styles.statStripItem}>
                <ProDayText style={[styles.statStripNum, { color: '#F59E0B' }]}>
                  {myTeamRow?.drawn ?? '—'}
                </ProDayText>
                <ProDayText style={styles.statStripLabel}>Nuls</ProDayText>
              </View>
              <View style={styles.statStripItem}>
                <ProDayText style={[styles.statStripNum, { color: '#EF4444' }]}>
                  {myTeamRow?.lost ?? '—'}
                </ProDayText>
                <ProDayText style={styles.statStripLabel}>Défaites</ProDayText>
              </View>
              <View style={styles.statStripItem}>
                <ProDayText style={[styles.statStripNum, { color: tokens.accent }]}>
                  {myTeamRow?.goal_diff != null ? (myTeamRow.goal_diff > 0 ? `+${myTeamRow.goal_diff}` : myTeamRow.goal_diff) : '—'}
                </ProDayText>
                <ProDayText style={styles.statStripLabel}>Diff.</ProDayText>
              </View>
            </View>

            {/* Série de Forme */}
            {myTeamRow?.form && myTeamRow.form.length > 0 ? (
              <View style={styles.formRow}>
                <ProDayText style={styles.formLabel}>Série récente :</ProDayText>
                <View style={styles.formPills}>
                  {myTeamRow.form.map((res, i) => (
                    <View
                      key={i}
                      style={[
                        styles.formPill,
                        res === 'V'
                          ? styles.formWin
                          : res === 'N'
                          ? styles.formDraw
                          : styles.formLoss,
                      ]}
                    >
                      <ProDayText style={styles.formPillText}>{res}</ProDayText>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          {/* SOUS-COMMUTATEUR POULE (CLASSEMENT / BUTEURS) */}
          <View style={styles.poolSubNav}>
            <TouchableOpacity
              onPress={() => {
                prodayHaptics.selection();
                setPoolSubTab('classement');
              }}
              style={[
                styles.poolSubBtn,
                poolSubTab === 'classement' && styles.poolSubBtnActive,
              ]}
            >
              <ProDayText
                style={[
                  styles.poolSubBtnText,
                  poolSubTab === 'classement' && styles.poolSubBtnTextActive,
                ]}
              >
                Classement Général ({poolData?.standings.length ?? 0} clubs)
              </ProDayText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                prodayHaptics.selection();
                setPoolSubTab('buteurs');
              }}
              style={[
                styles.poolSubBtn,
                poolSubTab === 'buteurs' && styles.poolSubBtnActive,
              ]}
            >
              <ProDayText
                style={[
                  styles.poolSubBtnText,
                  poolSubTab === 'buteurs' && styles.poolSubBtnTextActive,
                ]}
              >
                Buteurs de la Poule
              </ProDayText>
            </TouchableOpacity>
          </View>

          {/* CONTENU SOUS-ONGLET 1 : CLASSEMENT COMPLET 12 CLUBS */}
          {poolSubTab === 'classement' ? (
            <View style={styles.tableCard}>
              {effectiveStandings.length === 0 ? (
                <ProDayText style={styles.honestNote}>
                  {leagueId
                    ? 'Aucun classement disponible pour cette compétition pour le moment. Les données officielles apparaîtront dès leur synchronisation.'
                    : 'Aucune compétition FFF rattachée au club pour cette saison. Le classement apparaîtra ici dès qu’un rattachement sera validé — aucun championnat fictif n’est affiché.'}
                </ProDayText>
              ) : (
              <>
              {/* En-tête Tableau */}
              <View style={styles.tableHeaderRow}>
                <ProDayText style={[styles.colRank, styles.colHeadText]}>#</ProDayText>
                <ProDayText style={[styles.colTeam, styles.colHeadText]}>Club</ProDayText>
                <ProDayText style={[styles.colPts, styles.colHeadText]}>Pts</ProDayText>
                <ProDayText style={[styles.colNum, styles.colHeadText]}>J</ProDayText>
                <ProDayText style={[styles.colNum, styles.colHeadText]}>V</ProDayText>
                <ProDayText style={[styles.colNum, styles.colHeadText]}>N</ProDayText>
                <ProDayText style={[styles.colNum, styles.colHeadText]}>D</ProDayText>
                <ProDayText style={[styles.colNum, styles.colHeadText]}>Diff</ProDayText>
              </View>

              {/* Lignes du Tableau */}
              {effectiveStandings.map((row) => {
                const isProDay =
                  row.isMyTeam || (teamId != null && row.team_id === teamId);
                const isPromotion = row.rank === 1;
                const isPlayoff = row.rank === 2;
                const isRelegation = row.rank >= 10;

                return (
                  <View
                    key={row.team_id || row.rank}
                    style={[
                      styles.tableRow,
                      isProDay && styles.tableRowHighlight,
                    ]}
                  >
                    {/* Indicateur de statut (barre latérale de couleur) */}
                    <View
                      style={[
                        styles.rankIndicator,
                        isPromotion
                          ? styles.indicatorPromotion
                          : isPlayoff
                          ? styles.indicatorPlayoff
                          : isRelegation
                          ? styles.indicatorRelegation
                          : styles.indicatorNeutral,
                      ]}
                    />

                    <ProDayText
                      style={[
                        styles.colRank,
                        styles.rowCellText,
                        isProDay && { color: tokens.accent, fontWeight: '800' },
                      ]}
                    >
                      {row.rank}
                    </ProDayText>

                    <View style={styles.colTeam}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <ProDayText
                          style={[
                            styles.teamNameText,
                            isProDay && { color: tokens.accent, fontWeight: '800' },
                          ]}
                          numberOfLines={1}
                        >
                          {row.name}
                        </ProDayText>
                        {row.isOverridden ? (
                          <View style={styles.overriddenBadge}>
                            <ProDayText style={styles.overriddenBadgeText}>Corrigé</ProDayText>
                          </View>
                        ) : null}
                      </View>
                      {isProDay ? (
                        <View style={styles.myTeamBadge}>
                          <ProDayText style={styles.myTeamBadgeText}>NOTRE CLUB</ProDayText>
                        </View>
                      ) : null}
                    </View>

                    <ProDayText
                      style={[
                        styles.colPts,
                        styles.rowCellText,
                        { color: isProDay ? tokens.accent : tokens.foreground, fontWeight: '800' },
                      ]}
                    >
                      {row.points}
                    </ProDayText>

                    <ProDayText style={[styles.colNum, styles.rowCellTextMuted]}>
                      {row.played}
                    </ProDayText>

                    <ProDayText style={[styles.colNum, styles.rowCellTextMuted]}>
                      {row.won}
                    </ProDayText>

                    <ProDayText style={[styles.colNum, styles.rowCellTextMuted]}>
                      {row.drawn}
                    </ProDayText>

                    <ProDayText style={[styles.colNum, styles.rowCellTextMuted]}>
                      {row.lost}
                    </ProDayText>

                    <ProDayText
                      style={[
                        styles.colNum,
                        styles.rowCellText,
                        row.goal_diff > 0
                          ? { color: '#10B981' }
                          : row.goal_diff < 0
                          ? { color: '#EF4444' }
                          : styles.rowCellTextMuted,
                      ]}
                    >
                      {row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}
                    </ProDayText>
                  </View>
                );
              })}

              {/* Légende Officielle FFF */}
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <ProDayText style={styles.legendText}>
                    1er : Accession directe en National 3
                  </ProDayText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                  <ProDayText style={styles.legendText}>
                    2e : Barrages d'accession N3
                  </ProDayText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <ProDayText style={styles.legendText}>
                    10e à 12e : Relégation en Régional 2
                  </ProDayText>
                </View>
              </View>
              </>
              )}
            </View>
          ) : (
            /* CONTENU SOUS-ONGLET 2 : MEILLEURS BUTEURS DE LA POULE */
            <View style={styles.tableCard}>
              <View style={styles.scorersHeader}>
                <Icon name="trophy" size={16} color={tokens.accent} />
                <ProDayText style={styles.scorersTitle}>
                  Meilleurs Buteurs · Seniors R1 Poule B
                </ProDayText>
              </View>

              {(poolData?.scorers ?? []).length === 0 ? (
                <ProDayText style={styles.honestNote}>
                  Aucun buteur enregistré pour cette compétition.
                </ProDayText>
              ) : null}
              {(poolData?.scorers ?? []).map((scorer) => {
                const isProDayScorer =
                  effectiveTeamName != null &&
                  effectiveTeamName.trim().length > 0 &&
                  scorer.club.trim().toLowerCase() === effectiveTeamName.trim().toLowerCase();
                return (
                  <View
                    key={scorer.rank}
                    style={[
                      styles.scorerRow,
                      isProDayScorer && styles.tableRowHighlight,
                    ]}
                  >
                    <View style={styles.scorerRankBadge}>
                      <ProDayText style={[styles.scorerRankNum, { color: tokens.accent }]}>
                        {scorer.rank}
                      </ProDayText>
                    </View>

                    <View style={styles.scorerInfo}>
                      <ProDayText
                        style={[
                          styles.scorerName,
                          isProDayScorer && { color: tokens.accent, fontWeight: '800' },
                        ]}
                      >
                        {scorer.name}
                      </ProDayText>
                      <ProDayText style={styles.scorerClub}>{scorer.club}</ProDayText>
                    </View>

                    <View style={styles.scorerStats}>
                      <ProDayText style={styles.scorerGoalsNum}>{scorer.goals}</ProDayText>
                      <ProDayText style={styles.scorerGoalsLabel}>buts</ProDayText>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* BANNIÈRE DE TRANSITION VERS LES AUTRES LIGUES */}
          <PressableSpring
            onPress={() => {
              prodayHaptics.press();
              setActiveTab('toutes_ligues');
            }}
            style={styles.exploreBanner}
            scaleTo={0.98}
          >
            <View style={styles.exploreBannerLeft}>
              <Icon name="globe" size={22} color={tokens.accent} />
              <View style={{ flex: 1 }}>
                <ProDayText style={styles.exploreBannerTitle}>
                  Explorer toutes les ligues de France
                </ProDayText>
                <ProDayText style={styles.exploreBannerSub}>
                  Ligue 1, L2, National 1-3, Régionaux LPIFF & tous les Districts (92, 93, 75…)
                </ProDayText>
              </View>
            </View>
            <Icon name="chevron-forward" size={18} color={tokens.accent} />
          </PressableSpring>
        </ScrollView>
      ) : (
        /* 4. VUE ONGLET 2 : TOUTES LES LIGUES DE FRANCE (ELITE LEAGUE STANDINGS) */
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {/* Bandeau d'information explorateur */}
          <View style={styles.allLeaguesIntro}>
            <Icon name="alert-circle" size={16} color={tokens.accent} />
            <ProDayText style={styles.allLeaguesIntroText}>
              Consultez n'importe quel championnat homologué FFF. Tapez pour changer de division ou rechercher un club en France.
            </ProDayText>
          </View>

          {/* Moteur complet EliteLeagueStandings */}
          <EliteLeagueStandings
            initialLeagueId={leagueId ?? undefined}
            highlightTeamName={effectiveTeamName ?? undefined}
            highlightTeamId={teamId ?? undefined}
            accent={tokens.accent}
          />
        </ScrollView>
      )}

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
              <TouchableOpacity onPress={() => setModalVisible(false)}>
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
                      setSelectedTeamId(st.team_id);
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
                      selectedTeamId === st.team_id
                        ? { backgroundColor: tokens.accent, borderColor: tokens.accent }
                        : { backgroundColor: CLUB_TOKENS.elevated, borderColor: tokens.border },
                    ]}
                  >
                    <ProDayText
                      style={[
                        styles.teamPickText,
                        selectedTeamId === st.team_id
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
              {overrides[selectedTeamId] ? (
                <TouchableOpacity
                  onPress={() => {
                    const next = { ...overrides };
                    delete next[selectedTeamId];
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
                  if (!selectedTeamId) return;
                  const ptsNum = parseInt(editPts, 10);
                  const playedNum = parseInt(editPlayed, 10);
                  const wonNum = parseInt(editWon, 10);
                  const drawnNum = parseInt(editDrawn, 10);
                  const lostNum = parseInt(editLost, 10);
                  const diffNum = parseInt(editDiff, 10);

                  setOverrides((prev) => ({
                    ...prev,
                    [selectedTeamId]: {
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

    // Hero Club Card
    heroClubCard: {
      backgroundColor: tokens.surface,
      borderRadius: clubRadius.md,
      borderWidth: 1,
      borderColor: `${tokens.accent}35`,
      padding: clubSpace.md,
      marginBottom: clubSpace.md,
      gap: clubSpace.md,
    },
    heroClubTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroBadgeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: tokens.accentSoft,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: clubRadius.xs,
    },
    heroBadgeText: {
      color: tokens.accent,
      fontSize: 11,
      fontWeight: '700',
    },
    promotionPill: {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: clubRadius.xs,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    promotionPillText: {
      color: '#10B981',
      fontSize: 11,
      fontWeight: '800',
    },
    heroClubMiddle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroClubName: {
      fontSize: 22,
      fontWeight: '800',
      color: tokens.foreground,
      letterSpacing: -0.5,
    },
    heroClubSub: {
      fontSize: 12,
      color: tokens.muted,
      marginTop: 2,
    },
    heroPointsBox: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.elevated,
      borderRadius: clubRadius.sm,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: `${tokens.accent}40`,
    },
    heroPointsNum: {
      fontSize: 24,
      fontWeight: '900',
      color: tokens.accent,
      letterSpacing: -0.5,
    },
    heroPointsLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: tokens.muted,
      letterSpacing: 0.5,
    },
    statStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: tokens.elevated,
      borderRadius: clubRadius.sm,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    statStripItem: {
      alignItems: 'center',
      gap: 2,
    },
    statStripNum: {
      fontSize: 14,
      fontWeight: '800',
      color: tokens.foreground,
    },
    statStripLabel: {
      fontSize: 10,
      color: tokens.muted,
      fontWeight: '600',
    },
    formRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    formLabel: {
      fontSize: 12,
      color: tokens.muted,
      fontWeight: '600',
    },
    formPills: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    formPill: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    formWin: { backgroundColor: '#10B981' },
    formDraw: { backgroundColor: '#F59E0B' },
    formLoss: { backgroundColor: '#EF4444' },
    formPillText: {
      fontSize: 10,
      fontWeight: '900',
      color: '#FFFFFF',
    },

    // Sous-onglet Poule
    poolSubNav: {
      flexDirection: 'row',
      backgroundColor: tokens.surface,
      borderRadius: clubRadius.sm,
      padding: 3,
      marginBottom: clubSpace.md,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    poolSubBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: clubRadius.sm - 2,
    },
    poolSubBtnActive: {
      backgroundColor: tokens.elevated,
    },
    poolSubBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: tokens.muted,
    },
    poolSubBtnTextActive: {
      color: tokens.foreground,
      fontWeight: '700',
    },

    // Tableau de Classement
    honestNote: {
    color: tokens.muted,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  tableCard: {
      backgroundColor: tokens.surface,
      borderRadius: clubRadius.md,
      borderWidth: 1,
      borderColor: tokens.border,
      overflow: 'hidden',
      marginBottom: clubSpace.md,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 9,
      paddingHorizontal: 8,
      backgroundColor: tokens.elevated,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    colHeadText: {
      fontSize: 10,
      fontWeight: '800',
      color: tokens.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 9,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
      position: 'relative',
    },
    tableRowHighlight: {
      backgroundColor: tokens.accentSoft,
    },
    rankIndicator: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
    },
    indicatorPromotion: { backgroundColor: '#10B981' },
    indicatorPlayoff: { backgroundColor: '#F59E0B' },
    indicatorRelegation: { backgroundColor: '#EF4444' },
    indicatorNeutral: { backgroundColor: 'transparent' },

    colRank: {
      width: 22,
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '700',
    },
    colTeam: {
      flex: 1,
      paddingHorizontal: 6,
    },
    teamNameText: {
      fontSize: 13,
      fontWeight: '600',
      color: tokens.foreground,
    },
    myTeamBadge: {
      alignSelf: 'flex-start',
      backgroundColor: tokens.accentSoft,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 3,
      marginTop: 2,
    },
    myTeamBadgeText: {
      fontSize: 8,
      fontWeight: '900',
      color: tokens.accent,
      letterSpacing: 0.5,
    },
    colPts: {
      width: 32,
      textAlign: 'center',
      fontSize: 13,
    },
    colNum: {
      width: 24,
      textAlign: 'center',
      fontSize: 11,
    },
    rowCellText: {
      color: tokens.foreground,
    },
    rowCellTextMuted: {
      color: tokens.muted,
    },

    // Légende
    legendContainer: {
      padding: 10,
      backgroundColor: tokens.elevated,
      gap: 4,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: 11,
      color: tokens.muted,
      fontWeight: '500',
    },

    // Buteurs
    scorersHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
      backgroundColor: tokens.elevated,
    },
    scorersTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: tokens.foreground,
    },
    scorerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    scorerRankBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: tokens.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    scorerRankNum: {
      fontSize: 12,
      fontWeight: '800',
    },
    scorerInfo: {
      flex: 1,
    },
    scorerName: {
      fontSize: 13,
      fontWeight: '700',
      color: tokens.foreground,
    },
    scorerClub: {
      fontSize: 11,
      color: tokens.muted,
      marginTop: 1,
    },
    scorerStats: {
      alignItems: 'flex-end',
    },
    scorerGoalsNum: {
      fontSize: 16,
      fontWeight: '900',
      color: tokens.accent,
    },
    scorerGoalsLabel: {
      fontSize: 10,
      color: tokens.muted,
      fontWeight: '600',
    },

    // Bannière d'exploration
    exploreBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: tokens.surface,
      borderRadius: clubRadius.md,
      borderWidth: 1,
      borderColor: `${tokens.accent}40`,
      padding: clubSpace.md,
      gap: clubSpace.sm,
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
      color: tokens.foreground,
    },
    exploreBannerSub: {
      fontSize: 11,
      color: tokens.muted,
      marginTop: 2,
    },

    // Intro Toutes les Ligues
    allLeaguesIntro: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: tokens.surface,
      borderRadius: clubRadius.sm,
      padding: 10,
      borderWidth: 1,
      borderColor: tokens.border,
      marginBottom: 6,
    },
    allLeaguesIntroText: {
      flex: 1,
      fontSize: 12,
      color: tokens.muted,
      lineHeight: 16,
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
    syncStatusWarn: {
      fontSize: 10,
      marginTop: 2,
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
    overriddenBadge: {
      backgroundColor: 'rgba(245, 158, 11, 0.2)',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
    },
    overriddenBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: '#F59E0B',
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
