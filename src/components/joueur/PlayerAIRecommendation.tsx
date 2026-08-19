import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { JOUEUR_SURFACES, JOUEUR_RADIUS } from '../../theme/joueurDesignSystem';
import { spacing } from '../../theme/designTokens';

type Props = {
  title: string;
  body: string;
  cta?: string;
  accent?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Recommandation Coach IA — suggestion contextuelle. */
export function PlayerAIRecommendation({
  title,
  body,
  cta = 'Demander à mon Coach IA',
  accent = '#4C8BFF',
  onPress,
  style,
}: Props) {
  return (
    <PressableSpring onPress={onPress} scaleTo={0.98} haptic disabled={!onPress}>
      <View style={[styles.card, style]}>
        <View style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}>
          <Icon name="star-four-points" size={20} color={accent} />
        </View>
        <View style={styles.copy}>
          <ProDayText variant="caption" style={[styles.kicker, { color: accent }]}>
            COACH IA
          </ProDayText>
          <ProDayText variant="section" style={styles.title}>
            {title}
          </ProDayText>
          <ProDayText variant="caption" style={styles.body}>
            {body}
          </ProDayText>
          {onPress ? (
            <ProDayText variant="caption" style={[styles.cta, { color: accent }]}>
              {cta} →
            </ProDayText>
          ) : null}
        </View>
      </View>
    </PressableSpring>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: JOUEUR_RADIUS.md,
    backgroundColor: JOUEUR_SURFACES.card,
    borderWidth: 1,
    borderColor: JOUEUR_SURFACES.cardBorder,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 4 },
  kicker: { letterSpacing: 0.6 },
  title: { color: '#F3F8FF' },
  body: { color: 'rgba(243,248,255,0.68)' },
  cta: { marginTop: 6, fontWeight: '600' },
});
