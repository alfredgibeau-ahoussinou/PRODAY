import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AnimatedEntrance, PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import type { ClubTeamRow } from '../../../utils/clubStructureView';
import { buildClubTeamCardMeta } from './clubTeamsModel';
import { ProDayText } from '../../../components/ui/ProDayText';
import { clubForm } from '../theme/clubDesignSystem';

type Props = {
  row: ClubTeamRow;
  index?: number;
  logoUrl?: string | null;
  onPress: () => void;
};

/** Carte équipe — Design Obsidian Glass moderne, badges statut, zéro émoji. */
export function ClubTeamCard({ row, index = 0, logoUrl, onPress }: Props) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const meta = buildClubTeamCardMeta(row);

  return (
    <AnimatedEntrance kind="fadeUp" index={index} delayStep={35}>
      <PressableSpring
        onPress={onPress}
        scaleTo={0.98}
        haptic
        style={styles.cardContainer}
        accessibilityRole="button"
        accessibilityLabel={`${meta.title}${meta.hasCoach ? '' : ', sans coach'}`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            <Icon name="football" size={12} color={tokens.accent} />
            <ProDayText variant="caption" style={[styles.categoryText, { color: tokens.accent }]}>
              {meta.metaPrimary || row.category}
            </ProDayText>
          </View>

          <View style={styles.licensedPill}>
            <Icon name="people" size={11} color="#9CA3AF" />
            <ProDayText variant="caption" style={styles.licensedText}>
              {meta.metaSecondary}
            </ProDayText>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.crestWrap}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="cover" />
            ) : (
              <View style={[styles.logoPh, { backgroundColor: tokens.elevated }]}>
                <ProDayText variant="section" style={[styles.crestLetter, { color: tokens.accent }]}>
                  {(row.name.trim().charAt(0) || 'E').toUpperCase()}
                </ProDayText>
              </View>
            )}
          </View>

          <View style={styles.infoCol}>
            <ProDayText variant="section" numberOfLines={1} style={styles.teamTitle}>
              {meta.title}
            </ProDayText>

            <View style={styles.coachRow}>
              <Icon
                name="school"
                size={12}
                color={meta.hasCoach ? '#10B981' : '#F59E0B'}
              />
              <ProDayText
                variant="caption"
                numberOfLines={1}
                style={[
                  styles.coachText,
                  { color: meta.hasCoach ? '#9CA3AF' : '#F59E0B' },
                ]}
              >
                {meta.hasCoach ? `Coach : ${meta.coachesLabel}` : 'Staff à pourvoir'}
              </ProDayText>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.openRow}>
            <ProDayText variant="caption" style={[styles.openText, { color: tokens.accent }]}>
              Ouvrir le vestiaire
            </ProDayText>
            <Icon name="chevron-forward" size={13} color={tokens.accent} />
          </View>
        </View>
      </PressableSpring>
    </AnimatedEntrance>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: tokens.surface,
      borderRadius: clubForm.groupRadius,
      padding: 16,
      gap: 12,
      overflow: 'hidden',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: tokens.elevated,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    categoryText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    licensedPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: tokens.elevated,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    licensedText: {
      color: '#9CA3AF',
      fontSize: 11,
      fontWeight: '700',
    },
    cardBody: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    crestWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      backgroundColor: tokens.elevated,
    },
    logo: {
      width: '100%',
      height: '100%',
    },
    logoPh: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    crestLetter: {
      fontSize: 18,
      fontWeight: '900',
    },
    infoCol: {
      flex: 1,
      gap: 3,
    },
    teamTitle: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    coachRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    coachText: {
      fontSize: 12,
      fontWeight: '600',
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.06)',
    },
    openRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    openText: {
      fontSize: 12,
      fontWeight: '700',
    },
  });
