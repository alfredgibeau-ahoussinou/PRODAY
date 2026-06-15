import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { PRODAY_UNIQUES, type ProdayUniqueId } from '../../content/dashboardUniques';
import { Icon, type IconName } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface DashboardUniquesRailProps {
  onPressItem?: (id: ProdayUniqueId) => void;
}

export const DashboardUniquesRail: React.FC<DashboardUniquesRailProps> = ({
  onPressItem,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
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
              <Icon name={item.icon as IconName} size={18} color={c.brand} />
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
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: { marginBottom: spacing.xl },
    eyebrow: {
      fontSize: 10,
      fontWeight: '800',
      color: c.brand,
      letterSpacing: 1.2,
      marginBottom: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: '900',
      color: c.text,
      marginBottom: spacing.md,
    },
    rail: { gap: spacing.sm, paddingRight: spacing.lg },
    card: {
      width: 168,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    cardTitle: { fontSize: 14, fontWeight: '900', color: c.text },
    cardSub: { fontSize: 10, fontWeight: '800', color: c.brand, marginTop: 2 },
    cardDesc: { fontSize: 11, color: c.textMuted, marginTop: 6, lineHeight: 15 },
  });
}
