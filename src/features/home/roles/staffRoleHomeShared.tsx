import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import type { User, UserRole } from '../../../models/User';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { Icon } from '../../../components/ui/Icon';
import { ProDayText } from '../../../components/ui/ProDayText';
import { PressableSpring, SkeletonList, StaggerReveal } from '../../../components/motion';
import { HomeIaHeader } from '../components/HomeIaHeader';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTabNavigationActions } from '../../../hooks/useTabNavigationActions';
import { useTranslation } from '../../../context/LocaleContext';
import {
  getRoleDashboardMeta,
  getRolePanelActions,
  ROLE_HERO_ACCENT,
  type RolePanelAction,
} from '../../../content/roleDashboardExperience';
import { TAB_BAR_CONTENT_INSET } from '../../../navigation/tabBarLayout';
import { spacing, radius } from '../../../theme/designTokens';
import type { AppColors } from '../../../theme/universeTheme';

const pagePad = {
  paddingHorizontal: spacing.lg,
  paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg,
};

export interface StaffRoleHomeShellProps {
  profile: User;
  role: UserRole;
  unreadMessages: number;
  globalScore?: number;
  loading?: boolean;
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
  children: React.ReactNode;
}

export const StaffRoleHomeShell: React.FC<StaffRoleHomeShellProps> = ({
  profile,
  role,
  unreadMessages,
  globalScore = 0,
  loading = false,
  onRefresh,
  refreshing = false,
  children,
}) => {
  const { colors } = useAppTheme();
  const nav = useTabNavigationActions();
  const meta = getRoleDashboardMeta(role);
  const accent = ROLE_HERO_ACCENT[meta.heroTone];

  return (
    <ScrollView
      contentContainerStyle={pagePad}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        ) : undefined
      }
    >
      <HomeIaHeader
        profile={profile}
        globalScore={globalScore}
        notificationCount={unreadMessages}
        onAvatarPress={() => nav.openProfile()}
        onLocationPress={() => nav.openMatchs()}
        onNotificationsPress={() => nav.setActiveTab('messages')}
      />

      <StaggerReveal index={0}>
        <View style={[styles.hero, { borderColor: accent, backgroundColor: `${accent}14` }]}>
          <ProDayText variant="caption" style={[styles.eyebrow, { color: accent }]}>
            {meta.eyebrow}
          </ProDayText>
          <ProDayText variant="section">{meta.title}</ProDayText>
        </View>
      </StaggerReveal>

      {loading ? <SkeletonList count={3} variant="card" /> : children}
    </ScrollView>
  );
};

export const StaffSectionTitle: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => (
  <View style={styles.sectionHead}>
    <ProDayText variant="section">{title}</ProDayText>
    {subtitle ? (
      <ProDayText variant="caption" muted>
        {subtitle}
      </ProDayText>
    ) : null}
  </View>
);

export const StaffEmptyCard: React.FC<{ message: string }> = ({ message }) => {
  const { t } = useTranslation();
  return (
    <GlassCard style={styles.emptyCard}>
      <ProDayText variant="body" muted>
        {message || t('roleHome.empty')}
      </ProDayText>
    </GlassCard>
  );
};

interface StaffStatRowProps {
  items: { label: string; value: string; highlight?: boolean }[];
}

export const StaffStatRow: React.FC<StaffStatRowProps> = ({ items }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStatStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View
          key={item.label}
          style={[styles.stat, item.highlight && { backgroundColor: colors.accentSoft }]}
        >
          <ProDayText variant="hero" accent={item.highlight}>
            {item.value}
          </ProDayText>
          <ProDayText variant="caption" muted>
            {item.label}
          </ProDayText>
        </View>
      ))}
    </View>
  );
};

interface StaffQuickActionsProps {
  role: UserRole;
  onAction?: (action: RolePanelAction) => void;
}

export const StaffQuickActions: React.FC<StaffQuickActionsProps> = ({ role, onAction }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createActionStyles(colors), [colors]);
  const actions = getRolePanelActions(role);

  return (
    <View style={styles.grid}>
      {actions.map((action, index) => (
        <StaggerReveal key={action.title} index={index + 2} delayStep={40}>
          <PressableSpring
            style={[styles.tile, action.accent && { borderColor: colors.accent }]}
            onPress={() => onAction?.(action)}
            scaleTo={0.97}
            haptic
          >
            <Icon name={action.icon} size={20} color={action.accent ? colors.accent : colors.text} />
            <ProDayText variant="body" style={styles.tileTitle}>
              {action.title}
            </ProDayText>
            <ProDayText variant="caption" muted numberOfLines={2}>
              {action.sub}
            </ProDayText>
          </PressableSpring>
        </StaggerReveal>
      ))}
    </View>
  );
};

interface StaffListCardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  index?: number;
}

export const StaffListCard: React.FC<StaffListCardProps> = ({
  title,
  subtitle,
  meta,
  onPress,
  index = 0,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createListStyles(colors), [colors]);
  const inner = (
    <GlassCard style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.cardCopy}>
          <ProDayText variant="body">{title}</ProDayText>
          {subtitle ? (
            <ProDayText variant="caption" muted numberOfLines={2}>
              {subtitle}
            </ProDayText>
          ) : null}
        </View>
        <View style={styles.cardRight}>
          {meta ? (
            <ProDayText variant="caption" accent>
              {meta}
            </ProDayText>
          ) : null}
          {onPress ? <Icon name="chevron-forward" size={18} color={colors.textMuted} /> : null}
        </View>
      </View>
    </GlassCard>
  );

  if (!onPress) {
    return <StaggerReveal index={index}>{inner}</StaggerReveal>;
  }

  return (
    <StaggerReveal index={index}>
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic>
        {inner}
      </PressableSpring>
    </StaggerReveal>
  );
};

const styles = StyleSheet.create({
  hero: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  sectionHead: {
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  emptyCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
});

const createStatStyles = (c: AppColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    stat: {
      flex: 1,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      gap: spacing.xs,
    },
  });

const createActionStyles = (c: AppColors) =>
  StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    tile: {
      width: '48%',
      flexGrow: 1,
      minWidth: 140,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      gap: spacing.xs,
    },
    tileTitle: {
      fontWeight: '600',
    },
  });

const createListStyles = (c: AppColors) =>
  StyleSheet.create({
    card: {
      marginBottom: spacing.sm,
    },
    cardBody: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      gap: spacing.sm,
    },
    cardCopy: {
      flex: 1,
      gap: spacing.xs,
    },
    cardRight: {
      alignItems: 'flex-end',
      gap: spacing.xs,
    },
  });
