import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { useMatchSkinTokens } from './matchCenterUi';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { spacing } from '../../theme/designTokens';

interface MatchChapterIntroProps {
  kicker?: string;
  title: string;
  subtitle: string;
}

/** En-tête de chapitre Match Center — kicker + titre + support. */
export const MatchChapterIntro: React.FC<MatchChapterIntroProps> = ({
  kicker = 'Centre Match',
  title,
  subtitle,
}) => {
  const skin = useMatchSkinTokens();

  return (
    <View style={styles.wrap}>
      {kicker ? (
        <View style={[styles.kickerPill, { backgroundColor: skin.soft }]}>
          <ProDayText variant="caption" style={[styles.kicker, { color: skin.accent }]}>
            {kicker}
          </ProDayText>
        </View>
      ) : null}
      <ProDayText variant="section" style={[styles.title, { color: skin.foreground }]}>
        {title}
      </ProDayText>
      <ProDayText variant="caption" style={[styles.subtitle, { color: skin.muted }]}>
        {subtitle}
      </ProDayText>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xs,
    gap: 3,
  },
  kickerPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    marginBottom: 2,
  },
  kicker: {
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 9.5,
    fontWeight: '800',
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.4,
    fontSize: 20,
  },
  subtitle: {
    lineHeight: 16,
    fontSize: 12,
  },
});
