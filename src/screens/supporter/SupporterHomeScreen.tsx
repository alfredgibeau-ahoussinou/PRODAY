import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ProductLineContext';
import { ProDaySymbol } from '../../components/branding/ProDaySymbol';
import { SupporterEncouragementFeed } from '../../features/supporter';
import { colors, radius, spacing } from '../../theme/designTokens';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { Icon } from '../../components/ui/Icon';
import { AnimatedEntrance } from '../../components/motion';

export const SupporterHomeScreen: React.FC = () => {
  const { colors: themeColors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 16) + 12,
            paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedEntrance kind="fadeUp" index={0}>
          <View style={styles.hero}>
            <ProDaySymbol size={44} tone="white" />
            <Text style={styles.eyebrow}>Pôle Supporter</Text>
            <Text style={styles.title}>12e Homme</Text>
            <Text style={styles.subtitle}>
              Vibrez avec vos clubs favoris, suivez les scores en direct et encouragez les joueurs.
            </Text>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance kind="fadeUp" index={1}>
          <View style={styles.quickStatsRow}>
            <View style={styles.statCard}>
              <Icon name="heart" size={18} color={colors.brand} />
              <Text style={styles.statNumber}>142</Text>
              <Text style={styles.statLabel}>Encouragements</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="football" size={18} color={colors.tone4} />
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Matchs suivis</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="trophy" size={18} color={colors.bookmark} />
              <Text style={styles.statNumber}>N3</Text>
              <Text style={styles.statLabel}>Poule A</Text>
            </View>
          </View>
        </AnimatedEntrance>

        <SupporterEncouragementFeed />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brand,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
    marginTop: 2,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
});

