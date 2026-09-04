import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ELITE_COLORS } from '../../theme/prodayEliteTheme';
import { prodayHaptics } from '../../utils/prodayHaptics';

export interface LeagueStandingRow {
  rank: number;
  team_id: string;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  form: Array<'V' | 'N' | 'D'>;
  isMyTeam?: boolean;
}

interface EliteLeagueStandingsProps {
  leagueName?: string;
  divisionName?: string;
  standings: LeagueStandingRow[];
  onSelectTeam?: (teamId: string) => void;
}

export const EliteLeagueStandings: React.FC<EliteLeagueStandingsProps> = ({
  leagueName = 'Championnat Régional',
  divisionName = 'Poule A · Senior D1',
  standings,
  onSelectTeam,
}) => {
  const [activeTab, setActiveTab] = useState<'classement' | 'buteurs'>('classement');

  // Si pas de données réelles, proposer des données réalistes de démonstration FFF
  const tableData: LeagueStandingRow[] =
    standings && standings.length > 0
      ? standings
      : [
          {
            rank: 1,
            team_id: '1',
            name: 'ES Vitry',
            played: 12,
            won: 10,
            drawn: 1,
            lost: 1,
            goals_for: 28,
            goals_against: 8,
            goal_diff: 20,
            points: 31,
            form: ['V', 'V', 'V', 'N', 'V'],
          },
          {
            rank: 2,
            team_id: 'my-team',
            name: 'FC ProDay (Votre Club)',
            played: 12,
            won: 9,
            drawn: 2,
            lost: 1,
            goals_for: 25,
            goals_against: 11,
            goal_diff: 14,
            points: 29,
            form: ['V', 'V', 'N', 'V', 'V'],
            isMyTeam: true,
          },
          {
            rank: 3,
            team_id: '3',
            name: 'Red Star FC 2',
            played: 12,
            won: 8,
            drawn: 1,
            lost: 3,
            goals_for: 22,
            goals_against: 14,
            goal_diff: 8,
            points: 25,
            form: ['V', 'D', 'V', 'V', 'N'],
          },
          {
            rank: 4,
            team_id: '4',
            name: 'US Créteil Lusitanos',
            played: 12,
            won: 7,
            drawn: 2,
            lost: 3,
            goals_for: 20,
            goals_against: 13,
            goal_diff: 7,
            points: 23,
            form: ['N', 'V', 'V', 'D', 'V'],
          },
          {
            rank: 5,
            team_id: '5',
            name: 'Paris FC 3',
            played: 12,
            won: 6,
            drawn: 1,
            lost: 5,
            goals_for: 18,
            goals_against: 17,
            goal_diff: 1,
            points: 19,
            form: ['D', 'V', 'D', 'V', 'D'],
          },
          {
            rank: 6,
            team_id: '6',
            name: 'CS Brétigny 2',
            played: 12,
            won: 5,
            drawn: 3,
            lost: 4,
            goals_for: 16,
            goals_against: 15,
            goal_diff: 1,
            points: 18,
            form: ['V', 'N', 'D', 'N', 'V'],
          },
          {
            rank: 7,
            team_id: '7',
            name: 'FC Melun',
            played: 12,
            won: 4,
            drawn: 3,
            lost: 5,
            goals_for: 14,
            goals_against: 18,
            goal_diff: -4,
            points: 15,
            form: ['D', 'N', 'V', 'D', 'D'],
          },
          {
            rank: 8,
            team_id: '8',
            name: 'AS Choisy-le-Roi',
            played: 12,
            won: 3,
            drawn: 2,
            lost: 7,
            goals_for: 11,
            goals_against: 22,
            goal_diff: -11,
            points: 11,
            form: ['D', 'D', 'N', 'V', 'D'],
          },
          {
            rank: 9,
            team_id: '9',
            name: 'FC Gobelins 2',
            played: 12,
            won: 2,
            drawn: 2,
            lost: 8,
            goals_for: 9,
            goals_against: 24,
            goal_diff: -15,
            points: 8,
            form: ['D', 'D', 'D', 'N', 'D'],
          },
          {
            rank: 10,
            team_id: '10',
            name: 'US Alfortville',
            played: 12,
            won: 1,
            drawn: 1,
            lost: 10,
            goals_for: 7,
            goals_against: 28,
            goal_diff: -21,
            points: 4,
            form: ['D', 'D', 'D', 'D', 'N'],
          },
        ];

  const scorers = [
    { rank: 1, name: 'Thomas Dupont (FC ProDay)', goals: 12, matches: 10, ratio: '1.20' },
    { rank: 2, name: 'Karim Benali (ES Vitry)', goals: 11, matches: 12, ratio: '0.91' },
    { rank: 3, name: 'Sofiane Diallo (Red Star)', goals: 9, matches: 11, ratio: '0.81' },
    { rank: 4, name: 'Lucas Martin (US Créteil)', goals: 8, matches: 12, ratio: '0.66' },
  ];

  return (
    <View style={styles.container}>
      {/* EN-TÊTE CHAMPIONNAT */}
      <View style={styles.header}>
        <View>
          <Text style={styles.leagueName}>{leagueName}</Text>
          <Text style={styles.divisionName}>{divisionName}</Text>
        </View>

        {/* COMMUTATEUR CLASSEMENT / BUTEURS */}
        <View style={styles.tabSwitch}>
          <TouchableOpacity
            onPress={() => {
              prodayHaptics.tabSwitch();
              setActiveTab('classement');
            }}
            style={[styles.switchBtn, activeTab === 'classement' && styles.switchBtnActive]}
          >
            <Text
              style={[styles.switchText, activeTab === 'classement' && styles.switchTextActive]}
            >
              Classement
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              prodayHaptics.tabSwitch();
              setActiveTab('buteurs');
            }}
            style={[styles.switchBtn, activeTab === 'buteurs' && styles.switchBtnActive]}
          >
            <Text
              style={[styles.switchText, activeTab === 'buteurs' && styles.switchTextActive]}
            >
              Buteurs
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'classement' ? (
        <View style={styles.card}>
          {/* LIGNE DES TITRES DE COLONNES (100% FRANÇAIS) */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colHeader, styles.colRank]}>#</Text>
            <Text style={[styles.colHeader, styles.colTeam]}>Club</Text>
            <Text style={[styles.colHeader, styles.colStat]}>J</Text>
            <Text style={[styles.colHeader, styles.colStat]}>V</Text>
            <Text style={[styles.colHeader, styles.colStat]}>N</Text>
            <Text style={[styles.colHeader, styles.colStat]}>D</Text>
            <Text style={[styles.colHeader, styles.colStat]}>Diff</Text>
            <Text style={[styles.colHeader, styles.colPts]}>Pts</Text>
            <Text style={[styles.colHeader, styles.colForm]}>Forme</Text>
          </View>

          {/* LIGNES DU CLASSEMENT */}
          <ScrollView horizontal={false} showsVerticalScrollIndicator={false}>
            {tableData.map((row) => {
              const isPromotion = row.rank <= 2;
              const isRelegation = row.rank >= 9;

              return (
                <TouchableOpacity
                  key={row.team_id}
                  activeOpacity={0.8}
                  onPress={() => {
                    prodayHaptics.press();
                    onSelectTeam?.(row.team_id);
                  }}
                  style={[
                    styles.tableRow,
                    row.isMyTeam && styles.myTeamRow,
                  ]}
                >
                  {/* RANG AVEC INDICATEUR DE COULEUR (VERT = MONTÉE / ROUGE = RELÉGATION) */}
                  <View style={styles.colRankContainer}>
                    {isPromotion ? <View style={styles.dotPromotion} /> : null}
                    {isRelegation ? <View style={styles.dotRelegation} /> : null}
                    <Text
                      style={[
                        styles.rankText,
                        row.isMyTeam && styles.myTeamText,
                      ]}
                    >
                      {row.rank}
                    </Text>
                  </View>

                  {/* NOM DU CLUB */}
                  <Text
                    style={[
                      styles.teamName,
                      row.isMyTeam && styles.myTeamText,
                    ]}
                    numberOfLines={1}
                  >
                    {row.name}
                  </Text>

                  {/* STATS : J, V, N, D, DIFF, PTS */}
                  <Text style={styles.statText}>{row.played}</Text>
                  <Text style={styles.statText}>{row.won}</Text>
                  <Text style={styles.statText}>{row.drawn}</Text>
                  <Text style={styles.statText}>{row.lost}</Text>
                  <Text style={styles.statText}>
                    {row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}
                  </Text>
                  <Text style={[styles.ptsText, row.isMyTeam && styles.myTeamPts]}>
                    {row.points}
                  </Text>

                  {/* PASTILLES DE FORME (V, N, D) */}
                  <View style={styles.formContainer}>
                    {row.form.map((f, i) => (
                      <View
                        key={i}
                        style={[
                          styles.formDot,
                          f === 'V'
                            ? styles.formWon
                            : f === 'N'
                            ? styles.formDrawn
                            : styles.formLost,
                        ]}
                      >
                        <Text style={styles.formDotText}>{f}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* LÉGENDE DU CHAMPIONNAT */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={styles.dotPromotion} />
              <Text style={styles.legendText}>Zone de Montée</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.dotRelegation} />
              <Text style={styles.legendText}>Zone de Relégation</Text>
            </View>
          </View>
        </View>
      ) : (
        /* VUE BUTEURS OFFICIELLE */
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Classement des Meilleurs Buteurs</Text>
          {scorers.map((s) => (
            <View key={s.rank} style={styles.scorerRow}>
              <View style={styles.scorerRank}>
                <Text style={styles.scorerRankText}>{s.rank}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.scorerName}>{s.name}</Text>
                <Text style={styles.scorerMeta}>
                  {s.matches} matchs joués · Ratio {s.ratio} but/match
                </Text>
              </View>
              <View style={styles.scorerGoals}>
                <Text style={styles.scorerGoalsText}>{s.goals}</Text>
                <Text style={styles.scorerGoalsLabel}>buts</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
  },
  divisionName: {
    fontSize: 12,
    color: ELITE_COLORS.textSecondary,
    marginTop: 2,
  },
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: ELITE_COLORS.bgSurface,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
  },
  switchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switchBtnActive: {
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
  },
  switchText: {
    fontSize: 12,
    fontWeight: '700',
    color: ELITE_COLORS.textMuted,
  },
  switchTextActive: {
    color: ELITE_COLORS.textPrimary,
  },
  card: {
    backgroundColor: ELITE_COLORS.bgSurface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: ELITE_COLORS.border,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: ELITE_COLORS.textMuted,
    textAlign: 'center',
  },
  colRank: {
    width: 28,
  },
  colTeam: {
    flex: 1,
    textAlign: 'left',
    paddingLeft: 8,
  },
  colStat: {
    width: 26,
  },
  colPts: {
    width: 32,
    fontWeight: '900',
    color: ELITE_COLORS.textPrimary,
  },
  colForm: {
    width: 80,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  myTeamRow: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 10,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
  },
  colRankContainer: {
    width: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dotPromotion: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: ELITE_COLORS.primary,
    position: 'absolute',
    left: 2,
  },
  dotRelegation: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: ELITE_COLORS.danger,
    position: 'absolute',
    left: 2,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.textSecondary,
  },
  teamName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.textPrimary,
    paddingLeft: 8,
  },
  myTeamText: {
    color: ELITE_COLORS.gold,
    fontWeight: '900',
  },
  statText: {
    width: 26,
    fontSize: 12,
    color: ELITE_COLORS.textSecondary,
    textAlign: 'center',
  },
  ptsText: {
    width: 32,
    fontSize: 13,
    fontWeight: '900',
    color: ELITE_COLORS.textPrimary,
    textAlign: 'center',
  },
  myTeamPts: {
    color: ELITE_COLORS.gold,
  },
  formContainer: {
    width: 80,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
  },
  formDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formWon: {
    backgroundColor: ELITE_COLORS.primary,
  },
  formDrawn: {
    backgroundColor: '#64748B',
  },
  formLost: {
    backgroundColor: ELITE_COLORS.danger,
  },
  formDotText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000000',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: ELITE_COLORS.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 11,
    color: ELITE_COLORS.textMuted,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
    marginBottom: 12,
  },
  scorerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ELITE_COLORS.border,
    gap: 12,
  },
  scorerRank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorerRankText: {
    fontSize: 12,
    fontWeight: '800',
    color: ELITE_COLORS.gold,
  },
  scorerName: {
    fontSize: 14,
    fontWeight: '700',
    color: ELITE_COLORS.textPrimary,
  },
  scorerMeta: {
    fontSize: 11,
    color: ELITE_COLORS.textSecondary,
    marginTop: 2,
  },
  scorerGoals: {
    alignItems: 'center',
  },
  scorerGoalsText: {
    fontSize: 18,
    fontWeight: '900',
    color: ELITE_COLORS.primary,
  },
  scorerGoalsLabel: {
    fontSize: 10,
    color: ELITE_COLORS.textMuted,
  },
});
