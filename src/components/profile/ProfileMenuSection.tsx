import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring, StaggerReveal } from '../motion';
import { Icon, type IconName } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import type { AppColors } from '../../theme/universeTheme';
import { isProfileMobile, profileType } from './profileTypography';
import { spacing, radius } from '../../theme/designTokens';

export interface ProfileMenuItem {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  accent?: boolean;
}

interface ProfileMenuSectionProps {
  title: string;
  items: ProfileMenuItem[];
  colors: AppColors;
}

export const ProfileMenuSection: React.FC<ProfileMenuSectionProps> = ({
  title,
  items,
  colors,
}) => (
  <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    {title ? (
      <ProDayText variant="eyebrow" muted style={[styles.sectionTitle, profileType.sectionTitle]}>
        {title}
      </ProDayText>
    ) : null}
    {items.map((item, index) => (
      <StaggerReveal key={item.title} index={index}>
        <PressableSpring
          style={[
            styles.row,
            index < items.length - 1 && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            },
          ]}
          onPress={item.onPress}
          scaleTo={0.96}
          haptic
        >
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: item.accent ? colors.accentSoft : colors.surfaceMuted,
              },
            ]}
          >
            <Icon name={item.icon} size={20} color={item.accent ? colors.accent : colors.ink} />
          </View>
          <View style={styles.body}>
            <ProDayText variant="section" style={profileType.menuTitle}>
              {item.title}
            </ProDayText>
            {item.subtitle ? (
              <ProDayText variant="caption" muted style={profileType.menuSub}>
                {item.subtitle}
              </ProDayText>
            ) : null}
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textMuted} />
        </PressableSpring>
      </StaggerReveal>
    ))}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  sectionTitle: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: isProfileMobile ? spacing.sm + 2 : spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
});
