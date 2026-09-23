import React, { useState } from 'react';
import {
  proSemantic,
} from '../../theme/professionalDesign';
import { withAlpha } from '../../utils/coachTeamTheme';
import { COACH_CLEAR_SURFACES as CLEAR } from '../../utils/coachTeamTheme';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COACH_SITE } from '../../content/coachPageIdentity';

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


interface Props {
  data?: StandingsRow[];
  compact?: boolean;
  divisionName?: string;
  onSelectTeam?: (row: StandingsRow) => void;
  lightMode?: boolean;
}

export const CoachStandingsTable: React.FC<Props> = ({
  data = [],
  compact = false,
  divisionName = 'Compétition officielle rattachée',
  onSelectTeam,
  lightMode = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'home' | 'away'>('all');
  const [isAutoSync, setIsAutoSync] = useState(true);
  const [manualOverrideActive, setManualOverrideActive] = useState(false);

  const rows = compact ? data.slice(0, 5) : data;
  const hasNoData = rows.length === 0;

  const toggleSyncMode = () => {
    setManualOverrideActive(!manualOverrideActive);
    setIsAutoSync(manualOverrideActive);
  };

  return (
    <View style={[styles.card, lightMode && styles.cardLight]}>
      {/* Official Automated League Feed Status Bar (Apple Style) */}
      {!compact && (
        <View style={[styles.officialFeedBanner, lightMode && styles.officialFeedBannerLight]}>
          <View style={styles.officialFeedLeft}>
            <View style={[styles.liveSyncDot, manualOverrideActive && styles.liveSyncDotManual]} />
            <View>
              <Text style={[styles.officialFeedTitle, lightMode && styles.textDark]}>
                {manualOverrideActive ? 'Mode Manuel Actif (Contestation)' : 'Aucun flux officiel connecté'}
              </Text>
              <Text style={[styles.officialFeedSubtitle, lightMode && styles.textMutedDark]}>
                {manualOverrideActive
                  ? 'Modifications locales autorisées · Synchronisation suspendue'
                  : 'Le classement réel de la compétition rattachée s’affichera ici — aucun tableau fictif n’est montré.'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.overrideBtn, manualOverrideActive && styles.overrideBtnActive]}
            onPress={toggleSyncMode}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={manualOverrideActive ? 'sync-alert' : 'shield-sync-outline'}
              size={13}
              color={manualOverrideActive ? proSemantic.warning : proSemantic.success}
            />
            <Text style={[styles.overrideBtnText, manualOverrideActive && styles.overrideBtnTextActive]}>
              {manualOverrideActive ? 'Revenir Auto' : 'Forçage Manuel'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="trophy-outline" size={18} color={tokens.accent} />
          <View>
            <Text style={[styles.title, lightMode && styles.textDark]}>Classement Officiel FFF</Text>
            <Text style={[styles.subtitle, lightMode && styles.textMutedDark]}>{divisionName}</Text>
          </View>
        </View>

        {!compact && (
          <View style={[styles.filterPills, lightMode && styles.filterPillsLight]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.pill, filter === 'all' && styles.pillActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.pillText, lightMode && styles.textMutedDark, filter === 'all' && styles.pillTextActive]}>Général</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.pill, filter === 'home' && styles.pillActive]}
              onPress={() => setFilter('home')}
            >
              <Text style={[styles.pillText, lightMode && styles.textMutedDark, filter === 'home' && styles.pillTextActive]}>Dom.</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.pill, filter === 'away' && styles.pillActive]}
              onPress={() => setFilter('away')}
            >
              <Text style={[styles.pillText, lightMode && styles.textMutedDark, filter === 'away' && styles.pillTextActive]}>Ext.</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
        <View style={styles.tableContainer}>
          {/* Table Column Headers */}
          <View style={[styles.tableRowHeader, lightMode && styles.tableRowHeaderLight]}>
            <Text style={[styles.th, styles.colRank, lightMode && styles.textMutedDark]}>#</Text>
            <Text style={[styles.th, styles.colClub, lightMode && styles.textMutedDark]}>Club</Text>
            <Text style={[styles.th, styles.colPoints, lightMode && styles.textMutedDark]}>Pts</Text>
            <Text style={[styles.th, styles.colStat, lightMode && styles.textMutedDark]}>J</Text>
            <Text style={[styles.th, styles.colStat, lightMode && styles.textMutedDark]}>G</Text>
            <Text style={[styles.th, styles.colStat, lightMode && styles.textMutedDark]}>N</Text>
            <Text style={[styles.th, styles.colStat, lightMode && styles.textMutedDark]}>P</Text>
            <Text style={[styles.th, styles.colStat, lightMode && styles.textMutedDark]}>Diff</Text>
            {!compact && <Text style={[styles.th, styles.colForm, lightMode && styles.textMutedDark]}>Forme</Text>}
          </View>

          {/* Table Rows */}
          {hasNoData ? (
            <View style={styles.emptyRows}>
              <MaterialCommunityIcons name="trophy-outline" size={22} color={tokens.muted} />
              <Text style={[styles.emptyRowsTitle, lightMode && styles.textDark]}>
                Aucun classement disponible
              </Text>
              <Text style={[styles.emptyRowsText, lightMode && styles.textMutedDark]}>
                Le classement apparaîtra ici dès qu'une compétition officielle
                sera rattachée au club et que la source réelle sera connectée.
                Aucun tableau fictif n'est affiché.
              </Text>
            </View>
          ) : (
            rows.map((row) => {
            const isPromotion = row.rank <= 2;
            const isRelegation = row.rank >= 7;

            return (
              <TouchableOpacity
                key={row.rank}
                activeOpacity={0.8}
                style={[
                  styles.tableRow,
                  lightMode && styles.tableRowLight,
                  row.isCurrentTeam && (lightMode ? styles.currentTeamRowLight : styles.currentTeamRow),
                ]}
                onPress={() => onSelectTeam?.(row)}
              >                {/* Rank Badge */}
                <View style={[styles.rankBadge, lightMode && styles.rankBadgeLight, isPromotion && styles.rankPromo, isRelegation && styles.rankReleg]}>
                  <Text style={[styles.rankText, lightMode && styles.textDark, row.isCurrentTeam && (lightMode ? styles.boldGold : styles.boldWhite)]}>
                    {row.rank}
                  </Text>
                </View>

                {/* Club Name */}
                <View style={styles.colClub}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.clubNameText,
                      lightMode && styles.textDark,
                      row.isCurrentTeam && styles.currentTeamText,
                    ]}
                  >
                    {row.clubName}
                  </Text>
                </View>

                {/* Points */}
                <Text style={[styles.td, styles.colPoints, styles.pointsText, lightMode && styles.textDark, row.isCurrentTeam && styles.boldGold]}>
                  {row.points}
                </Text>

                {/* Stats: J, G, N, P, Diff */}
                <Text style={[styles.td, styles.colStat, lightMode && styles.textDark]}>{row.played}</Text>
                <Text style={[styles.td, styles.colStat, lightMode && styles.textDark]}>{row.won}</Text>
                <Text style={[styles.td, styles.colStat, lightMode && styles.textDark]}>{row.drawn}</Text>
                <Text style={[styles.td, styles.colStat, lightMode && styles.textDark]}>{row.lost}</Text>
                <Text
                  style={[
                    styles.td,
                    styles.colStat,
                    row.goalDiff > 0 ? styles.diffPositive : row.goalDiff < 0 ? styles.diffNegative : (lightMode ? styles.textDark : null),
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
          }))}
        </View>
      </ScrollView>

      {/* Legend Footer */}
      <View style={[styles.footerLegend, lightMode && styles.footerLegendLight]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBar, { backgroundColor: proSemantic.success }]} />
          <Text style={[styles.legendLabel, lightMode && styles.textMutedDark]}>Montée N3</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBar, { backgroundColor: proSemantic.info }]} />
          <Text style={[styles.legendLabel, lightMode && styles.textMutedDark]}>Barrages</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBar, { backgroundColor: proSemantic.danger }]} />
          <Text style={[styles.legendLabel, lightMode && styles.textMutedDark]}>Relégation R2</Text>
        </View>
      </View>
    </View>
  );
};

const tokens = COACH_SITE;

const styles = StyleSheet.create({
  emptyRows: {
    alignItems: 'flex-start',
    paddingVertical: 18,
    paddingHorizontal: 14,
    gap: 6,
  },
  emptyRowsTitle: {
    color: tokens.foreground,
    fontSize: 13.5,
    fontWeight: '700',
      },
  emptyRowsText: {
    color: withAlpha('FFFFFF', 0.5),
    fontSize: 11.5,
    lineHeight: 17,
      },
  cardLight: {
    backgroundColor: tokens.foreground,
    borderColor: CLEAR.border,
  },
  officialFeedBannerLight: {
    backgroundColor: CLEAR.surface,
    borderColor: CLEAR.border,
  },
  latestMatchStripLight: {
    backgroundColor: withAlpha('F59E0B', 0.1),
    borderColor: withAlpha('F59E0B', 0.4),
  },
  textDark: {
    color: CLEAR.foreground,
  },
  textMutedDark: {
    color: CLEAR.muted,
  },
  filterPillsLight: {
    backgroundColor: CLEAR.surface,
  },
  tableRowHeaderLight: {
    borderBottomColor: CLEAR.border,
  },
  tableRowLight: {
    borderBottomColor: CLEAR.surface,
  },
  currentTeamRowLight: {
    backgroundColor: withAlpha('F59E0B', 0.15),
    borderLeftColor: tokens.accent,
  },
  rankBadgeLight: {
    backgroundColor: CLEAR.surface,
  },
  footerLegendLight: {
    borderTopColor: CLEAR.border,
  },
  card: {
    backgroundColor: CLEAR.elevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: tokens.border,
    padding: 16,
    marginVertical: 8,
  },
  officialFeedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: withAlpha('FFFFFF', 0.04),
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: withAlpha('FFFFFF', 0.06),
  },
  officialFeedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  liveSyncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: proSemantic.success,
    marginRight: 8,
  },
  liveSyncDotManual: {
    backgroundColor: proSemantic.warning,
  },
  officialFeedTitle: {
    color: tokens.foreground,
    fontSize: 12,
    fontWeight: '700',
      },
  officialFeedSubtitle: {
    color: withAlpha('FFFFFF', 0.5),
    fontSize: 10,
    fontWeight: '500',
        marginTop: 1,
  },
  overrideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: withAlpha('10B981', 0.12),
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: withAlpha('10B981', 0.25),
  },
  overrideBtnActive: {
    backgroundColor: withAlpha('F59E0B', 0.12),
    borderColor: withAlpha('F59E0B', 0.25),
  },
  overrideBtnText: {
    color: proSemantic.success,
    fontSize: 10,
    fontWeight: '700',
      },
  overrideBtnTextActive: {
    color: proSemantic.warning,
  },
  latestMatchStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(tokens.accent, 0.08),
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: withAlpha(tokens.accent, 0.18),
  },
  latestMatchText: {
    color: tokens.elevated,
    fontSize: 11,
    fontWeight: '500',
        flex: 1,
  },
  latestMatchBold: {
    color: tokens.accent,
    fontWeight: '700',
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
    color: tokens.foreground,
    fontSize: 15,
    fontWeight: '700',
      },
  subtitle: {
    color: tokens.muted,
    fontSize: 11,
    fontWeight: '500',
      },
  filterPills: {
    flexDirection: 'row',
    backgroundColor: COACH_SITE.elevated,
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
    backgroundColor: withAlpha(tokens.accent, 0.25),
  },
  pillText: {
    color: tokens.muted,
    fontSize: 11,
    fontWeight: '600',
      },
  pillTextActive: {
    color: tokens.accent,
  },
  tableContainer: {
    minWidth: 360,
  },
  tableRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: tokens.border,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha('FFFFFF', 0.04),
    borderRadius: 8,
  },
  currentTeamRow: {
    backgroundColor: withAlpha(tokens.accent, 0.08),
    borderLeftWidth: 3,
    borderLeftColor: tokens.accent,
    paddingLeft: 4,
  },
  th: {
    color: tokens.muted,
    fontSize: 11,
    fontWeight: '600',
        textAlign: 'center',
  },
  td: {
    color: tokens.elevated,
    fontSize: 12,
    fontWeight: '500',
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
    backgroundColor: COACH_SITE.elevated,
  },
  rankPromo: {
    backgroundColor: withAlpha('10B981', 0.2),
  },
  rankReleg: {
    backgroundColor: withAlpha('EF4444', 0.2),
  },
  rankText: {
    color: tokens.elevated,
    fontSize: 11,
    fontWeight: '700',
      },
  boldWhite: {
    color: tokens.foreground,
  },
  boldGold: {
    color: tokens.accent,
    fontWeight: '800',
  },
  colClub: {
    width: 140,
    paddingLeft: 4,
  },
  clubNameText: {
    color: tokens.foreground,
    fontSize: 12,
    fontWeight: '600',
      },
  currentTeamText: {
    color: tokens.accent,
    fontWeight: '700',
  },
  colPoints: {
    width: 32,
    fontWeight: '700',
  },
  pointsText: {
    fontSize: 13,
    color: tokens.foreground,
  },
  colStat: {
    width: 28,
  },
  diffPositive: {
    color: proSemantic.success,
    fontWeight: '600',
  },
  diffNegative: {
    color: proSemantic.danger,
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
    backgroundColor: proSemantic.success,
  },
  formDraw: {
    backgroundColor: tokens.muted,
  },
  formLoss: {
    backgroundColor: proSemantic.danger,
  },
  formLetter: {
    color: tokens.foreground,
    fontSize: 9,
    fontWeight: '800',
  },
  footerLegend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: withAlpha('FFFFFF', 0.05),
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
    color: tokens.muted,
    fontSize: 10,
    fontWeight: '500',
      },
});
