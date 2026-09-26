import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ClubText } from './clubUi';
import { Icon } from '../../../components/ui/Icon';
import { PressableSpring } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';
import type { ClubThemeTokens } from '../theme/clubTokens';
import type { ClubTeamOverviewItem, TeamCompetitionOption } from './clubStandingsModel';
import { prodayHaptics } from '../../../utils/prodayHaptics';

interface ClubTeamStandingsCardProps {
  item: ClubTeamOverviewItem;
  tokens: ClubThemeTokens;
  onSelectTeam: (teamId: string, competitionId: string) => void;
  onSelectCompetition: (teamId: string, competitionId: string) => void;
}

export const ClubTeamStandingsCard: React.FC<ClubTeamStandingsCardProps> = ({
  item,
  tokens,
  onSelectTeam,
  onSelectCompetition,
}) => {
  const activeComp =
    item.competitions.find((c) => c.id === item.activeCompetitionId) ??
    item.competitions[0];

  const isKnockout = Boolean(activeComp?.isKnockout || item.isKnockout);

  return (
    <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: `${tokens.accent}30` }]}>
      {/* 1. Header: Équipe, Catégorie, Badge Genre */}
      <View style={styles.topRow}>
        <View style={styles.titleBox}>
          <ProDayText style={[styles.teamName, { color: tokens.foreground }]} numberOfLines={1}>
            {item.teamName}
          </ProDayText>
          <View style={[styles.categoryBadge, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
            <ProDayText style={[styles.categoryBadgeText, { color: tokens.muted }]}>
              {item.category}
            </ProDayText>
          </View>
        </View>

        {/* Rang ou Statut */}
        <View style={styles.rankPillBox}>
          {isKnockout ? (
            <View style={[styles.rankPill, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
              <Icon name="trophy" size={11} color="#F59E0B" />
              <ProDayText style={[styles.rankPillText, { color: '#F59E0B' }]}>Coupe</ProDayText>
            </View>
          ) : item.rank != null ? (
            <View
              style={[
                styles.rankPill,
                item.rank === 1
                  ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }
                  : { backgroundColor: tokens.elevated, borderColor: tokens.border },
              ]}
            >
              <ProDayText
                style={[
                  styles.rankPillText,
                  item.rank === 1 ? { color: '#10B981', fontWeight: '800' } : { color: tokens.accent },
                ]}
              >
                {item.rank === 1 ? '1er du groupe' : `${item.rank}e du groupe`}
              </ProDayText>
            </View>
          ) : (
            <View style={[styles.rankPill, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
              <ProDayText style={[styles.rankPillText, { color: '#F59E0B', fontWeight: '700' }]}>Non encore vérifié</ProDayText>
            </View>
          )}
        </View>
      </View>

      {/* 2. Sélecteur de compétitions si l'équipe participe à plusieurs tableaux */}
      {item.competitions.length > 1 ? (
        <View style={styles.compSelectorRow}>
          {item.competitions.map((comp) => {
            const isSelected = comp.id === item.activeCompetitionId;
            return (
              <TouchableOpacity
                key={comp.id}
                onPress={() => {
                  prodayHaptics.selection();
                  onSelectCompetition(item.id, comp.id);
                }}
                style={[
                  styles.compChip,
                  isSelected
                    ? { backgroundColor: tokens.accent, borderColor: tokens.accent }
                    : { backgroundColor: tokens.elevated, borderColor: tokens.border },
                ]}
              >
                <Icon
                  name={comp.isKnockout ? 'trophy' : 'stats-chart'}
                  size={11}
                  color={isSelected ? '#000000' : tokens.muted}
                />
                <ProDayText
                  style={[
                    styles.compChipText,
                    isSelected ? { color: '#000000', fontWeight: '700' } : { color: tokens.muted },
                  ]}
                  numberOfLines={1}
                >
                  {comp.name}
                </ProDayText>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.singleCompRow}>
          <Icon name="shield" size={12} color={tokens.accent} />
          <ProDayText style={[styles.singleCompText, { color: tokens.muted }]} numberOfLines={1}>
            {activeComp?.divisionLabel ?? 'Compétition FFF'} {activeComp?.groupLabel ? `· ${activeComp.groupLabel}` : ''}
          </ProDayText>
        </View>
      )}

      {/* 3. Zone principale de statistiques ou message honnête Coupe */}
      {isKnockout ? (
        <View style={[styles.knockoutNotice, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
          <Icon name="alert-circle" size={15} color="#F59E0B" />
          <ProDayText style={[styles.knockoutNoticeText, { color: tokens.muted }]}>
            Format à élimination directe : aucun classement par points. Suivez les tirages et matchs dans le calendrier officiel.
          </ProDayText>
        </View>
      ) : (
        <View style={styles.statBanner}>
          <View style={styles.statCol}>
            <ProDayText style={[styles.statNum, { color: tokens.accent }]}>
              {item.points != null ? item.points : '—'}
            </ProDayText>
            <ProDayText style={styles.statLabel}>POINTS</ProDayText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <ProDayText style={[styles.statNum, { color: tokens.foreground }]}>
              {item.played != null ? item.played : '—'}
            </ProDayText>
            <ProDayText style={styles.statLabel}>MATCHS</ProDayText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <ProDayText
              style={[
                styles.statNum,
                item.goalDiff != null && item.goalDiff > 0
                  ? { color: '#10B981' }
                  : item.goalDiff != null && item.goalDiff < 0
                  ? { color: '#EF4444' }
                  : { color: tokens.muted },
              ]}
            >
              {item.goalDiff != null ? (item.goalDiff > 0 ? `+${item.goalDiff}` : item.goalDiff) : '—'}
            </ProDayText>
            <ProDayText style={styles.statLabel}>DIFF</ProDayText>
          </View>

          {item.form && item.form.length > 0 ? (
            <>
              <View style={styles.statDivider} />
              <View style={styles.formCol}>
                <ProDayText style={styles.statLabel}>FORME</ProDayText>
                <View style={styles.formDotsRow}>
                  {item.form.slice(-3).map((res, i) => (
                    <View
                      key={i}
                      style={[
                        styles.miniFormDot,
                        res === 'V'
                          ? { backgroundColor: '#10B981' }
                          : res === 'N'
                          ? { backgroundColor: '#F59E0B' }
                          : { backgroundColor: '#EF4444' },
                      ]}
                    >
                      <ProDayText style={styles.miniFormDotText}>{res}</ProDayText>
                    </View>
                  ))}
                </View>
              </View>
            </>
          ) : null}
        </View>
      )}

      {/* 4. Action & Fraîcheur */}
      <View style={styles.footerRow}>
        <View style={styles.syncMetaBox}>
          <View style={[styles.dotLive, { backgroundColor: item.rank != null ? '#10B981' : '#F59E0B' }]} />
          <ProDayText style={[styles.syncMetaText, { color: tokens.muted }]}>
            {item.rank != null ? (item.lastSyncAt ? `Sync FFF : ${item.lastSyncAt}` : 'Synchronisé FFF') : 'Classement non encore vérifié'}
          </ProDayText>
        </View>

        {!isKnockout ? (
          <PressableSpring
            onPress={() => {
              prodayHaptics.press();
              onSelectTeam(item.id, activeComp.id);
            }}
            style={[styles.openTableBtn, { backgroundColor: tokens.accentSoft, borderColor: `${tokens.accent}40` }]}
            scaleTo={0.96}
          >
            <ProDayText style={[styles.openTableBtnText, { color: tokens.accent }]}>
              Voir le classement
            </ProDayText>
            <Icon name="chevron-forward" size={13} color={tokens.accent} />
          </PressableSpring>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: clubRadius.md,
    borderWidth: 1,
    padding: clubSpace.md,
    marginBottom: clubSpace.sm,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: clubRadius.xs,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rankPillBox: {
    alignItems: 'flex-end',
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: clubRadius.xs,
    borderWidth: 1,
  },
  rankPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  compSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: clubRadius.xs,
    borderWidth: 1,
  },
  compChipText: {
    fontSize: 11,
  },
  singleCompRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  singleCompText: {
    fontSize: 12,
  },
  knockoutNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: clubRadius.sm,
    borderWidth: 1,
  },
  knockoutNoticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  statBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: clubRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  statCol: {
    alignItems: 'center',
    gap: 2,
    minWidth: 46,
  },
  statNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  formCol: {
    alignItems: 'center',
    gap: 3,
  },
  formDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  miniFormDot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniFormDotText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  syncMetaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dotLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncMetaText: {
    fontSize: 10,
  },
  openTableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: clubRadius.sm,
    borderWidth: 1,
    minHeight: 36,
  },
  openTableBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
