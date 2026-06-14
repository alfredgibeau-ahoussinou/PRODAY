import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import { spacing, radius } from '../../../theme/designTokens';
import { useAppTheme } from '../../../context/ProductLineContext';
import { dismissV3Welcome, isV3WelcomeDismissed } from '../../../services/v3Preferences.service';
import { trackV3Event } from '../../../core/analytics/v3Events';

const TIPS = [
  'Hero IA : votre prochaine action recommandée',
  'Matchs scorés selon santé, niveau et distance',
  'XP et badges sur chaque action clé',
];

interface V3WelcomeBannerProps {
  uid: string;
}

/** Coach mark première visite — shell V3 (spec §4). */
export const V3WelcomeBanner: React.FC<V3WelcomeBannerProps> = ({ uid }) => {
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void isV3WelcomeDismissed(uid).then((dismissed) => {
      if (!cancelled && !dismissed) {
        setVisible(true);
        trackV3Event('v3_welcome_shown', { uid });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const handleDismiss = () => {
    setVisible(false);
    trackV3Event('v3_welcome_dismissed', { uid });
    void dismissV3Welcome(uid);
  };

  if (!visible) return null;

  return (
    <View style={styles.wrap}>
      <GlassCard variant="default" style={[styles.card, { borderColor: colors.accent }]}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Icon name="star-four-points" size={18} color={colors.accent} />
            <ProDayText variant="section">ProDay Intelligence</ProDayText>
          </View>
          <Pressable
            onPress={handleDismiss}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
            <Icon name="close" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
        <ProDayText variant="body" muted>
          Votre cockpit IA est actif. Voici ce qui change :
        </ProDayText>
        <View style={styles.list}>
          {TIPS.map((tip) => (
            <View key={tip} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: colors.accent }]} />
              <ProDayText variant="caption" muted style={styles.tip}>
                {tip}
              </ProDayText>
            </View>
          ))}
        </View>
        <Pressable
          onPress={handleDismiss}
          style={[styles.cta, { backgroundColor: colors.accent }]}
          accessibilityRole="button"
        >
          <ProDayText variant="caption" style={[styles.ctaText, { color: colors.brandInverse }]}>
            Compris
          </ProDayText>
        </Pressable>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  list: { gap: spacing.xs, marginTop: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3 },
  tip: { flex: 1, fontSize: 12, lineHeight: 17 },
  cta: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  ctaText: { fontWeight: '800', fontSize: 12 },
});
