import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { ELITE_COLORS, ELITE_RADIUS, ELITE_SPACING, useEliteResponsive } from '../../theme/prodayEliteTheme';
import { EliteCard } from '../ui/EliteCard';
import { EliteBadge } from '../ui/EliteBadge';
import { Icon } from '../ui/Icon';

export interface LeagueStandingItem {
  rank: number;
  clubId: string;
  clubName: string;
  logoUrl?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  diff: number;
  points: number;
  form: ('V' | 'N' | 'D')[];
  isUserClub?: boolean;
}

export interface TopScorerItem {
  rank: number;
  playerId: string;
  name: string;
  clubName: string;
  goals: number;
  matches: number;
  photoUrl?: string;
}

const MOCK_STANDINGS: LeagueStandingItem[] = [
  { rank: 1, clubId: '1', clubName: 'ES Vitry', played: 12, won: 10, drawn: 1, lost: 1, goalsFor: 29, goalsAgainst: 9, diff: 20, points: 31, form: ['V', 'V', 'V', 'N', 'V'] },
  { rank: 2, clubId: '2', clubName: 'FC Melun (Ton Club)', played: 12, won: 9, drawn: 2, lost: 1, goalsFor: 27, goalsAgainst: 11, diff: 16, points: 29, form: ['V', 'V', 'N', 'V', 'V'], isUserClub: true },
  { rank: 3, clubId: '3', clubName: 'Red Star FC 2', played: 12, won: 8, drawn: 2, lost: 2, goalsFor: 24, goalsAgainst: 12, diff: 12, points: 26, form: ['V', 'N', 'V', 'D', 'V'] },
  { rank: 4, clubId: '4', clubName: 'US Créteil Lusitanos', played: 12, won: 7, drawn: 3, lost: 2, goalsFor: 22, goalsAgainst: 14, diff: 8, points: 24, form: ['N', 'V', 'V', 'V', 'D'] },
  { rank: 5, clubId: '5', clubName: 'Paris FC 3', played: 12, won: 6, drawn: 2, lost: 4, goalsFor: 19, goalsAgainst: 16, diff: 3, points: 20, form: ['D', 'V', 'D', 'V', 'N'] },
  { rank: 6, clubId: '6', clubName: 'CS Meaux', played: 12, won: 5, drawn: 3, lost: 4, goalsFor: 18, goalsAgainst: 17, diff: 1, points: 18, form: ['N', 'D', 'V', 'N', 'V'] },
  { rank: 7, clubId: '7', clubName: 'FC Fleury 91', played: 12, won: 4, drawn: 4, lost: 4, goalsFor: 16, goalsAgainst: 18, diff: -2, points: 16, form: ['N', 'V', 'D', 'D', 'N'] },
  { rank: 8, clubId: '8', clubName: 'US Sénart-Moissy', played: 12, won: 4, drawn: 2, lost: 6, goalsFor: 15, goalsAgainst: 20, diff: -5, points: 14, form: ['D', 'D', 'V', 'D', 'N'] },
  { rank: 9, clubId: '9', clubName: 'RC Joinville', played: 12, won: 3, drawn: 3, lost: 6, goalsFor: 13, goalsAgainst: 22, diff: -9, points: 12, form: ['D', 'N', 'D', 'D', 'V'] },
  { rank: 10, clubId: '10', clubName: 'ESA Linas-Montlhéry', played: 12, won: 2, drawn: 2, lost: 8, goalsFor: 11, goalsAgainst: 24, diff: -13, points: 8, form: ['D', 'D', 'D', 'V', 'D'] },
  { rank: 11, clubId: '11', clubName: 'FC Gobelins 2', played: 12, won: 1, drawn: 3, lost: 8, goalsFor: 9, goalsAgainst: 26, diff: -17, points: 6, form: ['D', 'D', 'N', 'D', 'D'] },
  { rank: 12, clubId: '12', clubName: 'AS Choisy-le-Roi', played: 12, won: 0, drawn: 3, lost: 9, goalsFor: 7, goalsAgainst: 31, diff: -24, points: 3, form: ['D', 'N', 'D', 'D', 'D'] },
];

const MOCK_SCORERS: TopScorerItem[] = [
  { rank: 1, playerId: 'p1', name: 'Yanis Benali', clubName: 'ES Vitry', goals: 13, matches: 11 },
  { rank: 2, playerId: 'p2', name: 'Thomas Dupont (Toi)', clubName: 'FC Melun', goals: 11, matches: 12 },
  { rank: 3, playerId: 'p3', name: 'Mamadou Diallo', clubName: 'Red Star FC 2', goals: 9, matches: 10 },
  { rank: 4, playerId: 'p4', name: 'Alexandre Petit', clubName: 'US Créteil Lusitanos', goals: 8, matches: 12 },
  { rank: 5, playerId: 'p5', name: 'Lucas Martin', clubName: 'Paris FC 3', goals: 7, matches: 11 },
];

interface Props {
  leagueName?: string;
  standings?: LeagueStandingItem[];
  scorers?: TopScorerItem[];
  onTeamPress?: (teamId: string) => void;
  onScorerPress?: (playerId: string) => void;
}

export const EliteStandingsBoard: React.FC<Props> = ({
  leagueName = 'Départemental 1 · Poule A',
  standings = MOCK_STANDINGS,
  scorers = MOCK_SCORERS,
  onTeamPress,
  onScorerPress,
}) => {
  const [tab, setTab] = useState<'standings' | 'scorers'>('standings');
  const { isMobile, containerStyle } = useEliteResponsive();

  const renderFormBadge = (result: 'V' | 'N' | 'D', index: number) => {
    const bg = result === 'V' ? ELITE_COLORS.primary : result === 'N' ? '#94A3B8' : ELITE_COLORS.danger;
    return (
      <View key={index} style={[styles.formDot, { backgroundColor: bg }]}>
        <Text style={styles.formText}>{result}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Sélecteur d'onglet style FFF / MyCoach */}
      <View style={styles.segmentNav}>
        <TouchableOpacity
          style={[styles.segmentBtn, tab === 'standings' && styles.segmentBtnActive]}
          onPress={() => setTab('standings')}
        >
          <Icon name="trophy" size={16} color={tab === 'standings' ? ELITE_COLORS.textPrimary : ELITE_COLORS.textSecondary} />
          <Text style={[styles.segmentText, tab === 'standings' && styles.segmentTextActive]}>
            Classement Général
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, tab === 'scorers' && styles.segmentBtnActive]}
          onPress={() => setTab('scorers')}
        >
          <Icon name="football" size={16} color={tab === 'scorers' ? ELITE_COLORS.textPrimary : ELITE_COLORS.textSecondary} />
          <Text style={[styles.segmentText, tab === 'scorers' && styles.segmentTextActive]}>
            Top Buteurs
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.leagueTitle}>{leagueName}</Text>

      {tab === 'standings' ? (
        <EliteCard padding="sm" style={styles.card}>
          {/* Header du tableau */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colRank, styles.headerLabel]}>RG</Text>
            <Text style={[styles.colClub, styles.headerLabel]}>CLUB</Text>
            <Text style={[styles.colStat, styles.headerLabel]}>J</Text>
            <Text style={[styles.colStat, styles.headerLabel]}>V</Text>
            <Text style={[styles.colStat, styles.headerLabel]}>N</Text>
            <Text style={[styles.colStat, styles.headerLabel]}>D</Text>
            <Text style={[styles.colStat, styles.headerLabel]}>DIFF</Text>
            <Text style={[styles.colPts, styles.headerLabel]}>PTS</Text>
            {!isMobile && <Text style={[styles.colForm, styles.headerLabel]}>FORME</Text>}
          </View>

          {/* Lignes du classement */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {standings.map((item) => {
              const isPromotion = item.rank <= 2;
              const isRelegation = item.rank >= 11;
              const isUserClub = item.isUserClub;

              return (
                <TouchableOpacity
                  key={item.clubId}
                  activeOpacity={0.7}
                  onPress={() => onTeamPress?.(item.clubId)}
                  style={[
                    styles.row,
                    isUserClub && styles.userRow,
                  ]}
                >
                  <View style={styles.rankContainer}>
                    <View
                      style={[
                        styles.rankIndicator,
                        isPromotion && { backgroundColor: ELITE_COLORS.primary },
                        isRelegation && { backgroundColor: ELITE_COLORS.danger },
                      ]}
                    />
                    <Text style={[styles.rankText, isUserClub && { color: ELITE_COLORS.gold, fontWeight: '900' }]}>
                      {item.rank}
                    </Text>
                  </View>

                  <View style={styles.clubContainer}>
                    <Text
                      style={[styles.clubName, isUserClub && { color: ELITE_COLORS.gold, fontWeight: '800' }]}
                      numberOfLines={1}
                    >
                      {item.clubName}
                    </Text>
                  </View>

                  <Text style={styles.statText}>{item.played}</Text>
                  <Text style={styles.statText}>{item.won}</Text>
                  <Text style={styles.statText}>{item.drawn}</Text>
                  <Text style={styles.statText}>{item.lost}</Text>
                  <Text style={[styles.statText, { color: item.diff > 0 ? ELITE_COLORS.primary : item.diff < 0 ? ELITE_COLORS.danger : ELITE_COLORS.textSecondary }]}>
                    {item.diff > 0 ? `+${item.diff}` : item.diff}
                  </Text>
                  <Text style={[styles.ptsText, isUserClub && { color: ELITE_COLORS.gold }]}>
                    {item.points}
                  </Text>

                  {!isMobile && (
                    <View style={styles.formContainer}>
                      {item.form.slice(-5).map(renderFormBadge)}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Légende FFF */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: ELITE_COLORS.primary }]} />
              <Text style={styles.legendText}>Zone de Montée</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: ELITE_COLORS.danger }]} />
              <Text style={styles.legendText}>Zone de Relégation</Text>
            </View>
          </View>
        </EliteCard>
      ) : (
        /* Top Buteurs */
        <EliteCard padding="md" style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {scorers.map((scorer) => (
              <TouchableOpacity
                key={scorer.playerId}
                activeOpacity={0.7}
                onPress={() => onScorerPress?.(scorer.playerId)}
                style={styles.scorerRow}
              >
                <View style={styles.scorerRank}>
                  <Text style={[styles.scorerRankText, scorer.rank === 1 && { color: ELITE_COLORS.gold }]}>
                    {scorer.rank}
                  </Text>
                </View>

                <View style={styles.scorerInfo}>
                  <Text style={styles.scorerName}>{scorer.name}</Text>
                  <Text style={styles.scorerClub}>{scorer.clubName} · {scorer.matches} matchs</Text>
                </View>

                <View style={styles.scorerBadge}>
                  <View style={{ marginRight: 4 }}>
                    <Icon name="football" size={14} color={ELITE_COLORS.primary} />
                  </View>
                  <Text style={styles.scorerGoals}>{scorer.goals}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </EliteCard>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: ELITE_SPACING.lg,
    paddingVertical: ELITE_SPACING.md,
  },
  segmentNav: {
    flexDirection: 'row',
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    borderRadius: ELITE_RADIUS.lg,
    padding: 4,
    marginBottom: ELITE_SPACING.md,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: ELITE_RADIUS.md,
  },
  segmentBtnActive: {
    backgroundColor: ELITE_COLORS.bgSurface,
    borderWidth: 1,
    borderColor: ELITE_COLORS.borderHighlight,
  },
  segmentText: {
    color: ELITE_COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: ELITE_COLORS.textPrimary,
  },
  leagueTitle: {
    color: ELITE_COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: ELITE_SPACING.sm,
  },
  card: {
    borderRadius: ELITE_RADIUS.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ELITE_COLORS.border,
    paddingHorizontal: 8,
  },
  headerLabel: {
    color: ELITE_COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 8,
  },
  userRow: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: ELITE_RADIUS.sm,
    borderColor: ELITE_COLORS.borderGold,
    borderWidth: 1,
  },
  colRank: { width: 32, textAlign: 'center' },
  colClub: { flex: 1, paddingLeft: 6 },
  colStat: { width: 28, textAlign: 'center' },
  colPts: { width: 38, textAlign: 'center' },
  colForm: { width: 110, textAlign: 'center' },
  rankContainer: {
    width: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankIndicator: {
    position: 'absolute',
    left: 0,
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  rankText: {
    color: ELITE_COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  clubContainer: {
    flex: 1,
    paddingLeft: 6,
  },
  clubName: {
    color: ELITE_COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  statText: {
    width: 28,
    textAlign: 'center',
    color: ELITE_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  ptsText: {
    width: 38,
    textAlign: 'center',
    color: ELITE_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  formContainer: {
    width: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  formDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: ELITE_COLORS.border,
    marginTop: 4,
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
    color: ELITE_COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  scorerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  scorerRank: {
    width: 32,
    alignItems: 'center',
  },
  scorerRankText: {
    color: ELITE_COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  scorerInfo: {
    flex: 1,
    paddingHorizontal: 8,
  },
  scorerName: {
    color: ELITE_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  scorerClub: {
    color: ELITE_COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  scorerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ELITE_COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: ELITE_RADIUS.full,
    borderWidth: 1,
    borderColor: ELITE_COLORS.borderAccent,
  },
  scorerGoals: {
    color: ELITE_COLORS.primary,
    fontWeight: '900',
    fontSize: 14,
  },
});
