import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface StandingsRow {
  rank: number;
  clubName: string;
  clubCode?: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  form: ('W' | 'D' | 'L')[];
  isCurrentTeam?: boolean;
}

const DEFAULT_STANDINGS: StandingsRow[] = [
  {
    rank: 1,
    clubName: 'FC ProDay Démo',
    clubCode: 'FCP',
    points: 38,
    played: 16,
    won: 12,
    drawn: 2,
    lost: 2,
    goalsFor: 35,
    goalsAgainst: 12,
    goalDiff: 23,
    form: ['W', 'W', 'W', 'D', 'W'],
    isCurrentTeam: true,
  },
  {
    rank: 2,
    clubName: 'RC France Academy',
    clubCode: 'RCF',
    points: 35,
    played: 16,
    won: 11,
    drawn: 2,
    lost: 3,
    goalsFor: 29,
    goalsAgainst: 14,
    goalDiff: 15,
    form: ['W', 'W', 'L', 'W', 'W'],
  },
  {
    rank: 3,
    clubName: 'AS Montferrand',
    clubCode: 'ASM',
    points: 31,
    played: 16,
    won: 9,
    drawn: 4,
    lost: 3,
    goalsFor: 26,
    goalsAgainst: 18,
    goalDiff: 8,
    form: ['D', 'W', 'W', 'D', 'L'],
  },
  {
    rank: 4,
    clubName: 'Olympique Paris Sud',
    clubCode: 'OPS',
    points: 27,
    played: 16,
    won: 8,
    drawn: 3,
    lost: 5,
    goalsFor: 24,
    goalsAgainst: 20,
    goalDiff: 4,
    form: ['L', 'W', 'D', 'W', 'W'],
  },
  {
    rank: 5,
    clubName: 'CS Neuilly Football',
    clubCode: 'CSN',
    points: 23,
    played: 16,
    won: 6,
    drawn: 5,
    lost: 5,
    goalsFor: 20,
    goalsAgainst: 21,
    goalDiff: -1,
    form: ['D', 'L', 'W', 'L', 'D'],
  },
  {
    rank: 6,
    clubName: 'Stade Banlieue Ouest',
    clubCode: 'SBO',
    points: 20,
    played: 16,
    won: 5,
    drawn: 5,
    lost: 6,
    goalsFor: 18,
    goalsAgainst: 22,
    goalDiff: -4,
    form: ['L', 'D', 'L', 'W', 'D'],
  },
  {
    rank: 7,
    clubName: 'Entente Jeunesse 92',
    clubCode: 'EJ92',
    points: 15,
    played: 16,
    won: 4,
    drawn: 3,
    lost: 9,
    goalsFor: 14,
    goalsAgainst: 27,
    goalDiff: -13,
    form: ['L', 'L', 'W', 'L', 'L'],
  },
  {
    rank: 8,
    clubName: 'Union Sportive Étoile',
    clubCode: 'USE',
    points: 11,
    played: 16,
    won: 2,
    drawn: 5,
    lost: 9,
    goalsFor: 11,
    goalsAgainst: 31,
    goalDiff: -20,
    form: ['D', 'L', 'L', 'L', 'D'],
  },
];

interface Props {
  data?: StandingsRow[];
  compact?: boolean;
  divisionName?: string;
  onSelectTeam?: (row: StandingsRow) => void;
}

export const CoachStandingsTable: React.FC<Props> = ({
  data = DEFAULT_STANDINGS,
  compact = false,
  divisionName = 'Régional 1 — Poule B (Saison 2026/2027)',
  onSelectTeam,
}) => {
  const [filter, setFilter] = useState<'all' | 'home' | 'away'>('all');
  const rows = compact ? data.slice(0, 5) : data;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="trophy-outline" size={18} color="#C5A059" />
          <View>
            <Text style={styles.title}>Classement Officiel FFF</Text>
            <Text style={styles.subtitle}>{divisionName}</Text>
          </View>
        </View>

        {!compact && (
          <View style={styles.filterPills}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.pill, filter === 'all' && styles.pillActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.pillText, filter === 'all' && styles.pillTextActive]}>Général</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.pill, filter === 'home' && styles.pillActive]}
              onPress={() => setFilter('home')}
            >
              <Text style={[styles.pillText, filter === 'home' && styles.pillTextActive]}>Dom.</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.pill, filter === 'away' && styles.pillActive]}
              onPress={() => setFilter('away')}
            >
              <Text style={[styles.pillText, filter === 'away' && styles.pillTextActive]}>Ext.</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
        <View style={styles.tableContainer}>
          {/* Table Column Headers */}
          <View style={styles.tableRowHeader}>
            <Text style={[styles.th, styles.colRank]}>#</Text>
            <Text style={[styles.th, styles.colClub]}>Club</Text>
            <Text style={[styles.th, styles.colPoints]}>Pts</Text>
            <Text style={[styles.th, styles.colStat]}>J</Text>
            <Text style={[styles.th, styles.colStat]}>G</Text>
            <Text style={[styles.th, styles.colStat]}>N</Text>
            <Text style={[styles.th, styles.colStat]}>P</Text>
            <Text style={[styles.th, styles.colStat]}>Diff</Text>
            {!compact && <Text style={[styles.th, styles.colForm]}>Forme</Text>}
          </View>

          {/* Table Rows */}
          {rows.map((row) => {
            const isPromotion = row.rank <= 2;
            const isRelegation = row.rank >= 7;

            return (
              <TouchableOpacity
                key={row.rank}
                activeOpacity={0.8}
                style={[
                  styles.tableRow,
                  row.isCurrentTeam && styles.currentTeamRow,
                ]}
                onPress={() => onSelectTeam?.(row)}
              >
                {/* Rank Badge */}
                <View style={[styles.rankBadge, isPromotion && styles.rankPromo, isRelegation && styles.rankReleg]}>
                  <Text style={[styles.rankText, row.isCurrentTeam && styles.boldWhite]}>
                    {row.rank}
                  </Text>
                </View>

                {/* Club Name */}
                <View style={styles.colClub}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.clubNameText,
                      row.isCurrentTeam && styles.currentTeamText,
                    ]}
                  >
                    {row.clubName}
                  </Text>
                </View>

                {/* Points */}
                <Text style={[styles.td, styles.colPoints, styles.pointsText, row.isCurrentTeam && styles.boldGold]}>
                  {row.points}
                </Text>

                {/* Stats: J, G, N, P, Diff */}
                <Text style={[styles.td, styles.colStat]}>{row.played}</Text>
                <Text style={[styles.td, styles.colStat]}>{row.won}</Text>
                <Text style={[styles.td, styles.colStat]}>{row.drawn}</Text>
                <Text style={[styles.td, styles.colStat]}>{row.lost}</Text>
                <Text
                  style={[
                    styles.td,
                    styles.colStat,
                    row.goalDiff > 0 ? styles.diffPositive : row.goalDiff < 0 ? styles.diffNegative : null,
                  ]}
                >
                  {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                </Text>

                {/* Form Dots */}
                {!compact && (
                  <View style={[styles.colForm, styles.formContainer]}>
                    {row.form.map((res, i) => (
                      <View
                        key={i}
                        style={[
                          styles.formDot,
                          res === 'W' && styles.formWin,
                          res === 'D' && styles.formDraw,
                          res === 'L' && styles.formLoss,
                        ]}
                      >
                        <Text style={styles.formLetter}>{res === 'W' ? 'V' : res === 'D' ? 'N' : 'D'}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Legend Footer */}
      <View style={styles.footerLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBar, { backgroundColor: '#30D158' }]} />
          <Text style={styles.legendLabel}>Montée N3</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBar, { backgroundColor: '#0A84FF' }]} />
          <Text style={styles.legendLabel}>Barrages</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBar, { backgroundColor: '#FF453A' }]} />
          <Text style={styles.legendLabel}>Relégation R2</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  subtitle: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '500',
    fontFamily: '-apple-system',
  },
  filterPills: {
    flexDirection: 'row',
    backgroundColor: '#1C1C22',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.25)',
  },
  pillText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  pillTextActive: {
    color: '#C5A059',
  },
  tableContainer: {
    minWidth: 360,
  },
  tableRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
  },
  currentTeamRow: {
    backgroundColor: 'rgba(197, 160, 89, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#C5A059',
    paddingLeft: 4,
  },
  th: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
    textAlign: 'center',
  },
  td: {
    color: '#E5E5EA',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: '-apple-system',
    textAlign: 'center',
  },
  colRank: {
    width: 28,
    textAlign: 'center',
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    backgroundColor: '#1C1C22',
  },
  rankPromo: {
    backgroundColor: 'rgba(48, 209, 88, 0.2)',
  },
  rankReleg: {
    backgroundColor: 'rgba(255, 69, 58, 0.2)',
  },
  rankText: {
    color: '#E5E5EA',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  boldWhite: {
    color: '#FFFFFF',
  },
  boldGold: {
    color: '#C5A059',
    fontWeight: '800',
  },
  colClub: {
    width: 140,
    paddingLeft: 4,
  },
  clubNameText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  currentTeamText: {
    color: '#C5A059',
    fontWeight: '700',
  },
  colPoints: {
    width: 32,
    fontWeight: '700',
  },
  pointsText: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  colStat: {
    width: 28,
  },
  diffPositive: {
    color: '#30D158',
    fontWeight: '600',
  },
  diffNegative: {
    color: '#FF453A',
    fontWeight: '600',
  },
  colForm: {
    width: 96,
  },
  formContainer: {
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'center',
  },
  formDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formWin: {
    backgroundColor: '#30D158',
  },
  formDraw: {
    backgroundColor: '#8E8E93',
  },
  formLoss: {
    backgroundColor: '#FF453A',
  },
  formLetter: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  footerLegend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBar: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendLabel: {
    color: '#8B8B9A',
    fontSize: 10,
    fontWeight: '500',
    fontFamily: '-apple-system',
  },
});
