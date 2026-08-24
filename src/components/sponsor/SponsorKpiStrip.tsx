import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon, type IconName } from '../ui/Icon';
import { sponsorChrome } from './sponsorStyles';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
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
          <Text style={styles.value}>{item.value}</Text>
          <Text style={styles.label} numberOfLines={1}>
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
}) => {
  const styles = useMemo(() => createLinkStyles(), []);

  return (
    <PressableSpring onPress={onPress} style={styles.card} scaleTo={0.98} haptic>
      <View style={styles.icon}>
        <Icon name={icon} size={18} color={SPONSOR_THEME.primary} />
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
      gap: spacing.sm,
    },
    card: {
      flex: 1,
      backgroundColor: SPONSOR_THEME.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: SPONSOR_THEME.borderSubtle,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      minWidth: 0,
    },
    cardAlert: {
      borderColor: SPONSOR_THEME.border,
      backgroundColor: SPONSOR_THEME.primarySoft,
    },
    value: {
      color: SPONSOR_THEME.text,
      fontSize: 22,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
    label: {
      color: SPONSOR_THEME.textMuted,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginTop: 4,
      letterSpacing: 0.6,
    },
  });
}

function createLinkStyles() {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: SPONSOR_THEME.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: SPONSOR_THEME.borderSubtle,
      padding: spacing.md,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: SPONSOR_THEME.primarySoft,
    },
    copy: { flex: 1, minWidth: 0 },
    label: { color: SPONSOR_THEME.text, fontSize: 15, fontWeight: '800' },
    desc: { color: SPONSOR_THEME.textMuted, fontSize: 12, marginTop: 2, lineHeight: 16 },
  });
}
