import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon, type IconName } from '../ui/Icon';
import { sponsorChrome } from './sponsorStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

export type SponsorKpiItem = {
  key: string;
  label: string;
  value: string | number;
  icon: IconName;
  alert?: boolean;
};

interface SponsorKpiStripProps {
  items: SponsorKpiItem[];
}

export const SponsorKpiStrip: React.FC<SponsorKpiStripProps> = ({ items }) => {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View
          key={item.key}
          style={[styles.card, item.alert && styles.cardAlert]}
        >
          <View style={styles.iconWrap}>
            <Icon name={item.icon} size={16} color={sponsorChrome.accent} />
          </View>
          <Text style={styles.value}>{item.value}</Text>
          <Text style={styles.label} numberOfLines={2}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

interface SponsorQuickLinkProps {
  label: string;
  description: string;
  icon: IconName;
  onPress: () => void;
  colors: AppColors;
}

export const SponsorQuickLink: React.FC<SponsorQuickLinkProps> = ({
  label,
  description,
  icon,
  onPress,
  colors,
}) => {
  const styles = useMemo(() => createLinkStyles(), []);

  return (
    <PressableSpring onPress={onPress} style={styles.card} scaleTo={0.98} haptic>
      <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
        <Icon name={icon} size={18} color={colors.brand} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.desc} numberOfLines={2}>
          {description}
        </Text>
      </View>
      <Icon name="chevron-forward" size={16} color={sponsorChrome.textMuted} />
    </PressableSpring>
  );
};

function createStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    card: {
      flexGrow: 1,
      flexBasis: '47%',
      backgroundColor: sponsorChrome.shellElevated,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: sponsorChrome.shellBorder,
      padding: spacing.md,
      minWidth: 140,
    },
    cardAlert: {
      borderColor: 'rgba(245, 158, 11, 0.45)',
      backgroundColor: 'rgba(245, 158, 11, 0.08)',
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      backgroundColor: sponsorChrome.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    value: {
      color: sponsorChrome.text,
      fontSize: 22,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
    label: {
      color: sponsorChrome.textMuted,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginTop: 4,
      letterSpacing: 0.4,
    },
  });
}

function createLinkStyles() {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: sponsorChrome.shellElevated,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: sponsorChrome.shellBorder,
      padding: spacing.md,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: { flex: 1, minWidth: 0 },
    label: { color: sponsorChrome.text, fontSize: 15, fontWeight: '800' },
    desc: { color: sponsorChrome.textMuted, fontSize: 12, marginTop: 2, lineHeight: 16 },
  });
}
