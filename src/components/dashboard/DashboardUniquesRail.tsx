import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { PRODAY_UNIQUES, type ProdayUniqueId } from '../../content/dashboardUniques';
import { Icon, type IconName } from '../ui/Icon';
import { PressableSpring } from '../discover/PressableSpring';
import { colors, spacing, radius } from '../../theme/designTokens';

interface DashboardUniquesRailProps {
  onPressItem?: (id: ProdayUniqueId) => void;
}

export const DashboardUniquesRail: React.FC<DashboardUniquesRailProps> = ({
  onPressItem,
}) => (
  <View style={styles.wrap}>
    <Text style={styles.eyebrow}>EXCLUSIF PRODAY</Text>
    <Text style={styles.title}>Signature ProDay</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
    >
      {PRODAY_UNIQUES.map((item) => (
        <PressableSpring
          key={item.id}
          style={styles.card}
          onPress={() => onPressItem?.(item.id)}
        >
          <View style={styles.iconBox}>
            <Icon name={item.icon as IconName} size={18} color={colors.accent} />
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSub}>{item.subtitle}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        </PressableSpring>
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.md,
  },
  rail: { gap: spacing.sm, paddingRight: spacing.lg },
  card: {
    width: 168,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: { fontSize: 14, fontWeight: '900', color: colors.text },
  cardSub: { fontSize: 10, fontWeight: '800', color: colors.accent, marginTop: 2 },
  cardDesc: { fontSize: 11, color: colors.textMuted, marginTop: 6, lineHeight: 15 },
});
