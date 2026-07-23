import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { Icon, type IconName } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface ProfileMenuRowProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  badge?: string;
}

export const ProfileMenuRow: React.FC<ProfileMenuRowProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  danger,
  badge,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <PressableSpring style={styles.row} onPress={onPress} scaleTo={0.96} haptic>
      <View style={[styles.iconBox, danger && styles.iconBoxDanger]}>
        <Icon name={icon} size={20} color={danger ? c.brandInverse : c.text} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, danger && styles.titleDanger]}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Icon name="chevron-forward" size={18} color={c.textMuted} />
    </PressableSpring>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: radius.sm,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBoxDanger: { backgroundColor: c.accent, borderColor: c.accent },
    body: { flex: 1 },
    title: { fontSize: 15, fontWeight: '800', color: c.text },
    titleDanger: { color: c.text },
    sub: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    badge: {
      backgroundColor: c.brandSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.brand,
    },
    badgeText: { fontSize: 10, fontWeight: '800', color: c.brand },
  });
}
