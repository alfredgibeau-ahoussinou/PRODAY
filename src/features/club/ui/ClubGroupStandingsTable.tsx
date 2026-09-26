import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Icon } from '../../../components/ui/Icon';
import { PressableSpring } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';
import type { ClubThemeTokens } from '../theme/clubTokens';
import type { LeagueStandingRow } from '../../../components/matchs/EliteLeagueStandings';
import { prodayHaptics } from '../../../utils/prodayHaptics';

import { Linking } from 'react-native';

interface ClubGroupStandingsTableProps {
  standings: LeagueStandingRow[];
  divisionLabel: string;
  groupLabel?: string;
  season?: string;
  phase?: string;
  sourceUrl?: string;
  verificationStatus?: 'verified' | 'unverified' | 'pending_selection';
  freshnessLabel?: string;
  highlightTeamId?: string | null;
  highlightTeamName?: string | null;
  tokens: ClubThemeTokens;
  onBackToTeams?: () => void;
  onSelectOpponent: (row: LeagueStandingRow) => void;
}

export const ClubGroupStandingsTable: React.FC<ClubGroupStandingsTableProps> = ({
  standings,
  divisionLabel,
  groupLabel,
  season,
  phase,
  sourceUrl,
  verificationStatus = 'verified',
  freshnessLabel,
  highlightTeamId,
  highlightTeamName,
  tokens,
  onBackToTeams,
  onSelectOpponent,
}) => {
  const [viewMode, setViewMode] = useState<'essential' | 'detailed'>('essential');

  return (
    <View style={[styles.container, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
      {/* 1. Header de navigation : Bouton retour & Titres de poule */}
      <View style={[styles.tableTopHeader, { borderBottomColor: tokens.border }]}>
        {onBackToTeams ? (
          <TouchableOpacity
            onPress={() => {
              prodayHaptics.press();
              onBackToTeams();
            }}
            style={[styles.backBtn, { borderColor: tokens.border }]}
            accessibilityRole="button"
            accessibilityLabel="Retour à la liste des équipes"
          >
            <Icon name="arrow-back" size={16} color={tokens.accent} />
            <ProDayText style={[styles.backBtnText, { color: tokens.accent }]}>
              Équipes du club
            </ProDayText>
          </TouchableOpacity>
        ) : null}

        <View style={styles.titleArea}>
          <ProDayText style={[styles.leagueTitle, { color: tokens.foreground }]} numberOfLines={1}>
            {divisionLabel}
          </ProDayText>
          <ProDayText style={[styles.groupSubtitle, { color: tokens.muted }]} numberOfLines={1}>
            {groupLabel ? `${groupLabel} · ` : ''}{phase ? `${phase} · ` : ''}{season ? `Saison ${season}` : ''}
          </ProDayText>
          {sourceUrl ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(sourceUrl).catch(() => {})}
              style={styles.sourceLink}
              activeOpacity={0.7}
            >
              <Icon name="globe" size={11} color={tokens.accent} />
              <ProDayText style={[styles.sourceLinkText, { color: tokens.accent }]}>
                Publication officielle ↗
              </ProDayText>
            </TouchableOpacity>
          ) : null}
          {verificationStatus === 'unverified' ? (
            <View style={styles.unverifiedBadge}>
              <Icon name="alert-circle" size={11} color="#F59E0B" />
              <ProDayText style={styles.unverifiedBadgeText}>
                Classement non encore vérifié
              </ProDayText>
            </View>
          ) : null}
        </View>

        {freshnessLabel ? (
          <View style={styles.freshnessTag}>
            <View style={[styles.freshnessDot, { backgroundColor: '#10B981' }]} />
            <ProDayText style={[styles.freshnessText, { color: tokens.muted }]}>
              {freshnessLabel}
            </ProDayText>
          </View>
        ) : null}
      </View>

      {/* 2. Commutateur Mobile : Vue Essentielle vs Toutes les Stats */}
      <View style={[styles.modeToggleWrap, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
        <TouchableOpacity
          onPress={() => {
            prodayHaptics.selection();
            setViewMode('essential');
          }}
          style={[
            styles.modeBtn,
            viewMode === 'essential' && [styles.modeBtnActive, { backgroundColor: tokens.surface }],
          ]}
        >
          <ProDayText
            style={[
              styles.modeBtnText,
              { color: viewMode === 'essential' ? tokens.foreground : tokens.muted },
              viewMode === 'essential' && { fontWeight: '700' },
            ]}
          >
            Vue Essentielle (Pts, J, Diff)
          </ProDayText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            prodayHaptics.selection();
            setViewMode('detailed');
          }}
          style={[
            styles.modeBtn,
            viewMode === 'detailed' && [styles.modeBtnActive, { backgroundColor: tokens.surface }],
          ]}
        >
          <ProDayText
            style={[
              styles.modeBtnText,
              { color: viewMode === 'detailed' ? tokens.foreground : tokens.muted },
              viewMode === 'detailed' && { fontWeight: '700' },
            ]}
          >
            Toutes les stats (V, N, D, Buts)
          </ProDayText>
        </TouchableOpacity>
      </View>

      {/* 3. Contenu du Tableau */}
      {standings.length === 0 ? (
        <View style={styles.emptyBox}>
          <Icon name="alert-circle" size={24} color={tokens.muted} />
          <ProDayText style={[styles.emptyText, { color: tokens.muted }]}>
            Aucun classement officiel publié pour le moment. Les données FFF apparaîtront dès validation de la commission.
          </ProDayText>
        </View>
      ) : viewMode === 'essential' ? (
        /* MODE ESSENTIEL : Conçu pour les écrans étroits, colonnes fixes et texte aéré */
        <View style={styles.essentialTable}>
          {/* Header */}
          <View style={[styles.rowHeader, { backgroundColor: tokens.elevated, borderBottomColor: tokens.border }]}>
            <ProDayText style={[styles.colRank, styles.colHeadText]}>#</ProDayText>
            <ProDayText style={[styles.colTeamFlex, styles.colHeadText]}>Club</ProDayText>
            <ProDayText style={[styles.colPts, styles.colHeadText]}>Pts</ProDayText>
            <ProDayText style={[styles.colNum, styles.colHeadText]}>J</ProDayText>
            <ProDayText style={[styles.colNum, styles.colHeadText]}>Diff</ProDayText>
          </View>

          {/* Lignes */}
          {standings.map((row) => {
            const isMyTeam =
              Boolean(row.isMyTeam) ||
              Boolean(highlightTeamId && row.team_id.toLowerCase() === highlightTeamId.toLowerCase()) ||
              Boolean(
                highlightTeamName &&
                  highlightTeamName.length >= 3 &&
                  (row.name.toLowerCase().includes(highlightTeamName.toLowerCase()) ||
                    highlightTeamName.toLowerCase().includes(row.name.toLowerCase().split(' ')[0] ?? '')),
              );

            const isPromotion = row.rank <= 2;
            const isRelegation = row.rank >= standings.length - 2 && standings.length >= 8;

            return (
              <TouchableOpacity
                key={row.team_id || row.rank}
                activeOpacity={0.7}
                onPress={() => {
                  prodayHaptics.press();
                  onSelectOpponent(row);
                }}
                style={[
                  styles.tableRow,
                  { borderBottomColor: tokens.border },
                  isMyTeam && [styles.myTeamRow, { backgroundColor: `${tokens.accent}18` }],
                ]}
              >
                {/* Indicateur de zone */}
                <View
                  style={[
                    styles.rankBar,
                    isPromotion
                      ? styles.barPromotion
                      : isRelegation
                      ? styles.barRelegation
                      : styles.barNeutral,
                  ]}
                />

                <ProDayText
                  style={[
                    styles.colRank,
                    styles.rankNum,
                    isMyTeam && { color: tokens.accent, fontWeight: '900' },
                  ]}
                >
                  {row.rank}
                </ProDayText>

                <View style={styles.colTeamFlex}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ProDayText
                      style={[
                        styles.teamTitle,
                        { color: isMyTeam ? tokens.accent : tokens.foreground },
                        isMyTeam && { fontWeight: '800' },
                      ]}
                      numberOfLines={1}
                    >
                      {row.name}
                    </ProDayText>
                    {isMyTeam ? (
                      <View style={[styles.myTeamPill, { backgroundColor: `${tokens.accent}30` }]}>
                        <ProDayText style={[styles.myTeamPillText, { color: tokens.accent }]}>
                          NOTRE ÉQUIPE
                        </ProDayText>
                      </View>
                    ) : null}
                  </View>
                </View>

                <ProDayText
                  style={[
                    styles.colPts,
                    styles.ptsCell,
                    { color: isMyTeam ? tokens.accent : tokens.foreground },
                  ]}
                >
                  {row.points}
                </ProDayText>

                <ProDayText style={[styles.colNum, styles.mutedCell, { color: tokens.muted }]}>
                  {row.played}
                </ProDayText>

                <ProDayText
                  style={[
                    styles.colNum,
                    row.goal_diff > 0
                      ? { color: '#10B981', fontWeight: '700' }
                      : row.goal_diff < 0
                      ? { color: '#EF4444', fontWeight: '700' }
                      : { color: tokens.muted },
                  ]}
                >
                  {row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}
                </ProDayText>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        /* MODE DÉTAILLÉ : Défilement horizontal avec toutes les statistiques */
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.detailedTableInner}>
            {/* Header */}
            <View style={[styles.rowHeader, { backgroundColor: tokens.elevated, borderBottomColor: tokens.border }]}>
              <ProDayText style={[styles.colRank, styles.colHeadText]}>#</ProDayText>
              <ProDayText style={[styles.colTeamWide, styles.colHeadText]}>Club</ProDayText>
              <ProDayText style={[styles.colPts, styles.colHeadText]}>Pts</ProDayText>
              <ProDayText style={[styles.colNum, styles.colHeadText]}>J</ProDayText>
              <ProDayText style={[styles.colNum, styles.colHeadText]}>V</ProDayText>
              <ProDayText style={[styles.colNum, styles.colHeadText]}>N</ProDayText>
              <ProDayText style={[styles.colNum, styles.colHeadText]}>D</ProDayText>
              <ProDayText style={[styles.colNum, styles.colHeadText]}>BP</ProDayText>
              <ProDayText style={[styles.colNum, styles.colHeadText]}>BC</ProDayText>
              <ProDayText style={[styles.colNum, styles.colHeadText]}>Diff</ProDayText>
            </View>

            {/* Lignes */}
            {standings.map((row) => {
              const isMyTeam =
                Boolean(row.isMyTeam) ||
                Boolean(highlightTeamId && row.team_id.toLowerCase() === highlightTeamId.toLowerCase()) ||
                Boolean(
                  highlightTeamName &&
                    highlightTeamName.length >= 3 &&
                    (row.name.toLowerCase().includes(highlightTeamName.toLowerCase()) ||
                      highlightTeamName.toLowerCase().includes(row.name.toLowerCase().split(' ')[0] ?? '')),
                );

              const isPromotion = row.rank <= 2;
              const isRelegation = row.rank >= standings.length - 2 && standings.length >= 8;

              return (
                <TouchableOpacity
                  key={row.team_id || row.rank}
                  activeOpacity={0.7}
                  onPress={() => {
                    prodayHaptics.press();
                    onSelectOpponent(row);
                  }}
                  style={[
                    styles.tableRow,
                    { borderBottomColor: tokens.border },
                    isMyTeam && [styles.myTeamRow, { backgroundColor: `${tokens.accent}18` }],
                  ]}
                >
                  <View
                    style={[
                      styles.rankBar,
                      isPromotion
                        ? styles.barPromotion
                        : isRelegation
                        ? styles.barRelegation
                        : styles.barNeutral,
                    ]}
                  />

                  <ProDayText
                    style={[
                      styles.colRank,
                      styles.rankNum,
                      isMyTeam && { color: tokens.accent, fontWeight: '900' },
                    ]}
                  >
                    {row.rank}
                  </ProDayText>

                  <View style={styles.colTeamWide}>
                    <ProDayText
                      style={[
                        styles.teamTitle,
                        { color: isMyTeam ? tokens.accent : tokens.foreground },
                        isMyTeam && { fontWeight: '800' },
                      ]}
                      numberOfLines={1}
                    >
                      {row.name}
                    </ProDayText>
                  </View>

                  <ProDayText
                    style={[
                      styles.colPts,
                      styles.ptsCell,
                      { color: isMyTeam ? tokens.accent : tokens.foreground },
                    ]}
                  >
                    {row.points}
                  </ProDayText>

                  <ProDayText style={[styles.colNum, styles.mutedCell, { color: tokens.muted }]}>
                    {row.played}
                  </ProDayText>

                  <ProDayText style={[styles.colNum, styles.mutedCell, { color: tokens.muted }]}>
                    {row.won}
                  </ProDayText>

                  <ProDayText style={[styles.colNum, styles.mutedCell, { color: tokens.muted }]}>
                    {row.drawn}
                  </ProDayText>

                  <ProDayText style={[styles.colNum, styles.mutedCell, { color: tokens.muted }]}>
                    {row.lost}
                  </ProDayText>

                  <ProDayText style={[styles.colNum, styles.mutedCell, { color: tokens.muted }]}>
                    {row.goals_for}
                  </ProDayText>

                  <ProDayText style={[styles.colNum, styles.mutedCell, { color: tokens.muted }]}>
                    {row.goals_against}
                  </ProDayText>

                  <ProDayText
                    style={[
                      styles.colNum,
                      row.goal_diff > 0
                        ? { color: '#10B981', fontWeight: '700' }
                        : row.goal_diff < 0
                        ? { color: '#EF4444', fontWeight: '700' }
                        : { color: tokens.muted },
                    ]}
                  >
                    {row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}
                  </ProDayText>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* 4. Légende officielle FFF */}
      <View style={[styles.legendBox, { backgroundColor: tokens.elevated, borderTopColor: tokens.border }]}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <ProDayText style={[styles.legendText, { color: tokens.muted }]}>
            1er - 2e : Montée / Barrages d'accession
          </ProDayText>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <ProDayText style={[styles.legendText, { color: tokens.muted }]}>
            Zone de relégation
          </ProDayText>
        </View>
        <ProDayText style={[styles.hintTouch, { color: tokens.muted }]}>
          💡 Touchez un club adverse pour consulter sa fiche publique.
        </ProDayText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: clubRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: clubSpace.md,
  },
  tableTopHeader: {
    padding: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: clubRadius.sm,
    borderWidth: 1,
    marginBottom: 4,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  titleArea: {
    gap: 2,
  },
  leagueTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  groupSubtitle: {
    fontSize: 12,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  sourceLinkText: {
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  unverifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
  },
  freshnessTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  freshnessDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  freshnessText: {
    fontSize: 10,
  },
  modeToggleWrap: {
    flexDirection: 'row',
    padding: 3,
    marginHorizontal: 10,
    marginVertical: 8,
    borderRadius: clubRadius.sm,
    borderWidth: 1,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: clubRadius.sm - 2,
  },
  modeBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  modeBtnText: {
    fontSize: 11,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  essentialTable: {
    width: '100%',
  },
  detailedTableInner: {
    minWidth: 480,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  colHeadText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    minHeight: 44, // Accessibilité tactile
    position: 'relative',
  },
  myTeamRow: {
    // Teinte d'accentuation
  },
  rankBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  barPromotion: { backgroundColor: '#10B981' },
  barRelegation: { backgroundColor: '#EF4444' },
  barNeutral: { backgroundColor: 'transparent' },

  colRank: {
    width: 24,
    textAlign: 'center',
    fontSize: 12,
  },
  rankNum: {
    fontWeight: '700',
    color: '#8E8E93',
  },
  colTeamFlex: {
    flex: 1,
    paddingHorizontal: 8,
  },
  colTeamWide: {
    width: 140,
    paddingHorizontal: 8,
  },
  teamTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  myTeamPill: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  myTeamPillText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  colPts: {
    width: 34,
    textAlign: 'center',
  },
  ptsCell: {
    fontSize: 13,
    fontWeight: '900',
  },
  colNum: {
    width: 28,
    textAlign: 'center',
    fontSize: 12,
  },
  mutedCell: {
    fontWeight: '500',
  },
  legendBox: {
    padding: 10,
    borderTopWidth: 1,
    gap: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
  },
  hintTouch: {
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
