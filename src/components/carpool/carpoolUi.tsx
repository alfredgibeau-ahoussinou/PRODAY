import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon, type IconName } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';

type CarpoolEmptyStateProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCta?: () => void;
};

export const CarpoolEmptyState: React.FC<CarpoolEmptyStateProps> = ({
  icon,
  title,
  subtitle,
  ctaLabel,
  onCta,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createEmptyStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.iconRing}>
        <ProDayGradient kind="card" style={styles.iconBg}>
          <Icon name={icon} size={28} color={colors.accent} variant="filled" />
        </ProDayGradient>
      </View>
      <ProDayText variant="section" style={styles.title}>
        {title}
      </ProDayText>
      <ProDayText variant="body" muted style={styles.sub}>
        {subtitle}
      </ProDayText>
      {ctaLabel && onCta ? (
        <PressableSpring onPress={onCta} scaleTo={0.96} haptic>
          <ProDayGradient kind="cta" style={styles.cta}>
            <ProDayText variant="caption" inverse style={styles.ctaText}>
              {ctaLabel}
            </ProDayText>
          </ProDayGradient>
        </PressableSpring>
      ) : null}
    </View>
  );
};

type CarpoolSectionIntroProps = {
  icon: IconName;
  title: string;
  subtitle: string;
};

export const CarpoolSectionIntro: React.FC<CarpoolSectionIntroProps> = ({
  icon,
  title,
  subtitle,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createIntroStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconChip, { backgroundColor: colors.accentSoft }]}>
        <Icon name={icon} size={18} color={colors.accent} />
      </View>
      <View style={styles.copy}>
        <ProDayText variant="section">{title}</ProDayText>
        <ProDayText variant="body" muted style={styles.sub}>
          {subtitle}
        </ProDayText>
      </View>
    </View>
  );
};

type CarpoolFilterChipsProps<T extends string> = {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
};

export function CarpoolFilterChips<T extends string>({
  options,
  value,
  onChange,
}: CarpoolFilterChipsProps<T>) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createChipStyles(colors), [colors]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((opt) => {
        const on = opt.id === value;
        return (
          <PressableSpring
            key={opt.id}
            onPress={() => onChange(opt.id)}
            scaleTo={0.96}
            haptic
          >
            <View
              style={[
                styles.chip,
                on
                  ? { backgroundColor: colors.accent, borderColor: colors.accent }
                  : { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              ]}
            >
              <ProDayText
                variant="caption"
                inverse={on}
                accent={!on}
                style={styles.chipText}
              >
                {opt.label}
              </ProDayText>
            </View>
          </PressableSpring>
        );
      })}
    </ScrollView>
  );
};

type CarpoolReminderBannerProps = {
  count: number;
  onReserve: () => void;
  onPropose: () => void;
};

export const CarpoolReminderBanner: React.FC<CarpoolReminderBannerProps> = ({
  count,
  onReserve,
  onPropose,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createBannerStyles(colors), [colors]);

  return (
    <View style={styles.shell}>
      <ProDayGradient kind="cta" style={styles.gradient} />
      <View style={styles.content}>
        <View style={styles.left}>
          <View style={styles.badge}>
            <ProDayText variant="caption" inverse style={styles.badgeText}>
              {count}
            </ProDayText>
          </View>
          <View style={styles.copy}>
            <ProDayText variant="caption" inverse style={styles.title}>
              {t('carpool.reminder.title')}
            </ProDayText>
            <ProDayText variant="caption" inverse muted style={styles.hint}>
              {t('carpool.reminder.hint')}
            </ProDayText>
          </View>
        </View>
        <View style={styles.actions}>
          <PressableSpring onPress={onReserve} scaleTo={0.96} haptic>
            <View style={styles.actionBtn}>
              <ProDayText variant="caption" inverse style={styles.actionText}>
                {t('carpool.reminder.reserve')}
              </ProDayText>
            </View>
          </PressableSpring>
          <PressableSpring onPress={onPropose} scaleTo={0.96} haptic>
            <View style={[styles.actionBtn, styles.actionGhost]}>
              <ProDayText variant="caption" inverse style={styles.actionText}>
                {t('carpool.reminder.propose')}
              </ProDayText>
            </View>
          </PressableSpring>
        </View>
      </View>
    </View>
  );
};

export const CarpoolCardAccent: React.FC<{ kind?: 'cta' | 'card' }> = ({ kind = 'card' }) => (
  <ProDayGradient kind={kind} style={cardAccentStyles.bar} />
);

const cardAccentStyles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
  },
});

function createEmptyStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    iconRing: {
      padding: 3,
      borderRadius: 40,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.xs,
    },
    iconBg: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { fontWeight: '800', textAlign: 'center' },
    sub: { textAlign: 'center', lineHeight: 22 },
    cta: {
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
    },
    ctaText: { fontWeight: '800' },
  });
}

function createIntroStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      marginBottom: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconChip: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: { flex: 1, gap: 4 },
    sub: { lineHeight: 20 },
  });
}

function createChipStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
      marginBottom: spacing.md,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    chipText: { fontWeight: '800' },
  });
}

function createBannerStyles(_colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    shell: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    gradient: { ...StyleSheet.absoluteFillObject },
    content: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    badge: {
      minWidth: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.22)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xs,
    },
    badgeText: { fontWeight: '900', fontSize: 15 },
    copy: { flex: 1, gap: 2 },
    title: { fontWeight: '800' },
    hint: { opacity: 0.88 },
    actions: { flexDirection: 'row', gap: spacing.sm },
    actionBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    actionGhost: {
      backgroundColor: 'rgba(0,0,0,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.35)',
    },
    actionText: { fontWeight: '800' },
  });
}
