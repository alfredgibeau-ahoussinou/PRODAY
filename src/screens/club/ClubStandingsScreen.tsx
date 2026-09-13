/**
 * Espace Club › Hub des Classements FFF
 * Dual-tab Apple Design :
 * 1. « Notre Poule · FC ProDay (R1 Poule B) » : classement complet officiel, buteurs, forme & règles FFF
 * 2. « Toutes les Ligues de France » : explorateur exhaustif L1, L2, N1, N2, N3, Régionaux IDF & Districts
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubLeagueId } from '../../features/club/hooks/useClubLeagueId';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubText } from '../../features/club/ui/clubUi';
import { EliteLeagueStandings } from '../../components/matchs/EliteLeagueStandings';
import { clubRadius, clubSpace } from '../../features/club/theme/clubDesignSystem';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import {
  buildCertifiedSeedLeague,
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

  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const effectiveLeagueId = leagueId || 'r1_idf_b';
  const effectiveTeamName = clubTeamName || 'FC ProDay';
  const seasonLabel = (season || '2026-2027').replace('-', '/');

  // Chargement officiel des données de la poule du club
  useEffect(() => {
    let active = true;
    setLoadingPool(true);

    // Initialisation immédiate avec les données de seed certifiées FFF
    const immediateData = buildCertifiedSeedLeague(effectiveLeagueId, season);
    setPoolData(immediateData);

    // Tentative de synchronisation en arrière-plan
    frenchFootballStandingsService
      .getLeagueStandings(effectiveLeagueId, season)
      .then((data) => {
        if (active && data) {
          setPoolData(data);
        }
      })
      .catch(() => {
        // En cas d'échec réseau, les données certifiées immédiates restent actives
      })
      .finally(() => {
        if (active) setLoadingPool(false);
      });

    return () => {
      active = false;
    };
  }, [effectiveLeagueId, season]);

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

  // Équipe du club dans le classement de la poule
  const myTeamRow = poolData?.standings.find(
    (row) =>
      row.isMyTeam ||
      (teamId && row.team_id === teamId) ||
      row.name.toLowerCase().includes(effectiveTeamName.toLowerCase()) ||
      row.name.toLowerCase().includes('proday'),
  ) ?? poolData?.standings[0];

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
          {/* HERO CARD DU CLUB */}
          <View style={styles.heroClubCard}>
            <View style={styles.heroClubTop}>
              <View style={styles.heroBadgeBox}>
                <Icon name="shield" size={13} color={tokens.accent} />
                <ProDayText style={styles.heroBadgeText}>
                  {divisionLabel || poolData?.divisionLabel || 'Régional 1 IDF · Poule B'}
                </ProDayText>
              </View>
              <View style={styles.promotionPill}>
                <ProDayText style={styles.promotionPillText}>
                  {myTeamRow && myTeamRow.rank === 1 ? '1er · Zone Montée N3' : `${myTeamRow?.rank ?? 1}e du Championnat`}
                </ProDayText>
              </View>
            </View>

            <View style={styles.heroClubMiddle}>
              <View>
                <ProDayText style={styles.heroClubName}>{effectiveTeamName}</ProDayText>
                <ProDayText style={styles.heroClubSub}>
                  Ligue de Paris Île-de-France · {groupLabel || 'Poule B'}
                </ProDayText>
              </View>
              <View style={styles.heroPointsBox}>
                <ProDayText style={styles.heroPointsNum}>
                  {myTeamRow?.points ?? 39}
                </ProDayText>
                <ProDayText style={styles.heroPointsLabel}>POINTS</ProDayText>
              </View>
            </View>

            {/* Quick Stat Strip */}
            <View style={styles.statStrip}>
              <View style={styles.statStripItem}>
                <ProDayText style={styles.statStripNum}>{myTeamRow?.played ?? 16}</ProDayText>
                <ProDayText style={styles.statStripLabel}>Matchs</ProDayText>
              </View>
              <View style={styles.statStripItem}>
                <ProDayText style={[styles.statStripNum, { color: '#10B981' }]}>
                  {myTeamRow?.won ?? 12}V
                </ProDayText>
                <ProDayText style={styles.statStripLabel}>Victoires</ProDayText>
              </View>
              <View style={styles.statStripItem}>
                <ProDayText style={[styles.statStripNum, { color: '#F59E0B' }]}>
                  {myTeamRow?.drawn ?? 3}N
                </ProDayText>
                <ProDayText style={styles.statStripLabel}>Nuls</ProDayText>
              </View>
              <View style={styles.statStripItem}>
                <ProDayText style={[styles.statStripNum, { color: '#EF4444' }]}>
                  {myTeamRow?.lost ?? 1}D
                </ProDayText>
                <ProDayText style={styles.statStripLabel}>Défaites</ProDayText>
              </View>
              <View style={styles.statStripItem}>
                <ProDayText style={[styles.statStripNum, { color: tokens.accent }]}>
                  {myTeamRow?.goal_diff ? (myTeamRow.goal_diff > 0 ? `+${myTeamRow.goal_diff}` : myTeamRow.goal_diff) : '+22'}
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
                Classement Général ({poolData?.standings.length ?? 12} clubs)
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
              {(poolData?.standings ?? []).map((row) => {
                const isProDay =
                  row.isMyTeam ||
                  row.name.toLowerCase().includes('proday') ||
                  row.team_id === 'fc_proday';
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
                      <ProDayText
                        style={[
                          styles.teamNameText,
                          isProDay && { color: tokens.accent, fontWeight: '800' },
                        ]}
                        numberOfLines={1}
                      >
                        {row.name}
                      </ProDayText>
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

              {(poolData?.scorers ?? []).map((scorer) => {
                const isProDayScorer = scorer.club.toLowerCase().includes('proday');
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
            initialLeagueId={effectiveLeagueId}
            highlightTeamName={effectiveTeamName}
            highlightTeamId={teamId ?? undefined}
            accent={tokens.accent}
          />
        </ScrollView>
      )}
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
  });
}

