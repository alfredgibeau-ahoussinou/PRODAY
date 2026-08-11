import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon, type IconName } from '../ui/Icon';
import { useAdminStyles, adminChrome } from './adminStyles';
import { spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

export type AdminPageHeroAction = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'ghost';
};

interface AdminPageHeroProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: AdminPageHeroAction[];
}

export const AdminPageHero: React.FC<AdminPageHeroProps> = ({
  kicker = 'PRODAY ADMIN',
  title,
  subtitle,
  actions,
}) => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.hero}>
      <View style={styles.glow} pointerEvents="none" />
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actions && actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((action) => {
            const primary = action.variant !== 'ghost';
            return (
              <PressableSpring
                key={action.label}
                onPress={action.onPress}
                scaleTo={0.97}
                haptic
                style={[styles.btn, primary ? styles.btnPrimary : styles.btnGhost]}
              >
                {action.icon ? (
                  <Icon
                    name={action.icon}
                    size={16}
                    color={primary ? '#FFFFFF' : adminChrome.accent}
                  />
                ) : null}
                <Text style={[styles.btnText, primary ? styles.btnTextPrimary : styles.btnTextGhost]}>
                  {action.label}
                </Text>
              </PressableSpring>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    hero: {
      backgroundColor: adminChrome.band,
      borderRadius: 2,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      overflow: 'hidden',
      gap: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
    },
    glow: {
      position: 'absolute',
      top: -40,
      right: -30,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: adminChrome.accentGlow,
    },
    kicker: {
      color: adminChrome.accent,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.6,
      zIndex: 1,
    },
    title: {
      color: adminChrome.text,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.6,
      zIndex: 1,
    },
    subtitle: {
      color: adminChrome.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 4,
      zIndex: 1,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.md,
      zIndex: 1,
    },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: 11,
      borderRadius: 2,
    },
    btnPrimary: {
      backgroundColor: adminChrome.accent,
    },
    btnGhost: {
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
    },
    btnText: { fontSize: 13, fontWeight: '800' },
    btnTextPrimary: { color: '#FFFFFF' },
    btnTextGhost: { color: adminChrome.text },
  });
}
