import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PressableSpring, AnimatedEntrance } from '../motion';
import { Icon, type IconName } from '../ui/Icon';
import { CARPOOL_SITE } from '../../content/carpoolSite';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';

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
  const styles = useMemo(() => createEmptyStyles(), []);

  return (
    <AnimatedEntrance kind="fadeUp">
      <View style={styles.wrap}>
        <View style={styles.iconMark}>
          <Icon name={icon} size={24} color={CARPOOL_SITE.asphalt} variant="filled" />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
        {ctaLabel && onCta ? (
          <PressableSpring onPress={onCta} scaleTo={0.96} haptic style={styles.cta}>
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </PressableSpring>
        ) : null}
      </View>
    </AnimatedEntrance>
  );
};

type CarpoolSectionIntroProps = {
  icon: IconName;
  title: string;
  subtitle: string;
};

export const CarpoolSectionIntro: React.FC<CarpoolSectionIntroProps> = ({
  title,
  subtitle,
}) => {
  const styles = useMemo(() => createIntroStyles(), []);

  return (
    <View style={styles.wrap}>
      <View style={styles.rule} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{subtitle}</Text>
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
  const styles = useMemo(() => createChipStyles(), []);

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
            scaleTo={0.95}
            haptic
            style={[styles.chip, on && styles.chipOn]}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{opt.label}</Text>
          </PressableSpring>
        );
      })}
    </ScrollView>
  );
}

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
  const { t } = useTranslation();
  const styles = useMemo(() => createBannerStyles(), []);

  return (
    <View style={styles.shell}>
      <View style={styles.left}>
        <Text style={styles.count}>{count}</Text>
        <View style={styles.copy}>
          <Text style={styles.title}>{t('carpool.reminder.title')}</Text>
          <Text style={styles.hint}>{t('carpool.reminder.hint')}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <PressableSpring onPress={onReserve} scaleTo={0.96} haptic style={styles.actionBtn}>
          <Text style={styles.actionText}>{t('carpool.reminder.reserve')}</Text>
        </PressableSpring>
        <PressableSpring onPress={onPropose} scaleTo={0.96} haptic style={styles.actionGhost}>
          <Text style={styles.actionGhostText}>{t('carpool.reminder.propose')}</Text>
        </PressableSpring>
      </View>
    </View>
  );
};

export const CarpoolCardAccent: React.FC<{ kind?: 'cta' | 'card' }> = () => (
  <View style={cardAccentStyles.bar} />
);

const cardAccentStyles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: CARPOOL_SITE.signal,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
});

function createEmptyStyles() {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: CARPOOL_SITE.fog,
      backgroundColor: CARPOOL_SITE.surface,
    },
    iconMark: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: CARPOOL_SITE.signal,
      marginBottom: spacing.xs,
    },
    title: {
      fontFamily: CARPOOL_SITE.display,
      fontSize: 22,
      lineHeight: 26,
      color: CARPOOL_SITE.ink,
      fontWeight: '800',
      textAlign: 'center',
    },
    sub: {
      fontSize: 14,
      lineHeight: 21,
      color: CARPOOL_SITE.inkMuted,
      textAlign: 'center',
    },
    cta: {
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingVertical: 14,
      borderRadius: 999,
      backgroundColor: CARPOOL_SITE.asphalt,
    },
    ctaText: {
      fontFamily: CARPOOL_SITE.display,
      fontSize: 14,
      fontWeight: '800',
      color: '#fff',
    },
  });
}

function createIntroStyles() {
  return StyleSheet.create({
    wrap: {
      gap: 8,
      marginBottom: spacing.md,
      paddingBottom: spacing.md,
    },
    rule: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: CARPOOL_SITE.signal,
    },
    title: {
      fontFamily: CARPOOL_SITE.display,
      fontSize: 24,
      lineHeight: 28,
      color: CARPOOL_SITE.ink,
      fontWeight: '800',
    },
    sub: {
      fontSize: 14,
      lineHeight: 21,
      color: CARPOOL_SITE.inkMuted,
    },
  });
}

function createChipStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: spacing.xs,
      marginBottom: spacing.md,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1.5,
      borderColor: CARPOOL_SITE.fog,
      backgroundColor: CARPOOL_SITE.surface,
    },
    chipOn: {
      backgroundColor: CARPOOL_SITE.asphalt,
      borderColor: CARPOOL_SITE.asphalt,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '700',
      color: CARPOOL_SITE.inkMuted,
    },
    chipTextOn: {
      color: '#fff',
      fontWeight: '800',
    },
  });
}

function createBannerStyles() {
  return StyleSheet.create({
    shell: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      padding: spacing.md,
      gap: spacing.sm,
      borderRadius: 16,
      backgroundColor: CARPOOL_SITE.surface,
      borderWidth: 1,
      borderColor: CARPOOL_SITE.signal,
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    count: {
      fontFamily: CARPOOL_SITE.display,
      fontSize: 28,
      color: CARPOOL_SITE.signalDeep,
      fontWeight: '800',
      minWidth: 36,
    },
    copy: { flex: 1, gap: 2 },
    title: { fontWeight: '800', color: CARPOOL_SITE.ink, fontSize: 14 },
    hint: { color: CARPOOL_SITE.inkMuted, fontSize: 12 },
    actions: { flexDirection: 'row', gap: spacing.sm },
    actionBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 999,
      backgroundColor: CARPOOL_SITE.signal,
    },
    actionGhost: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 999,
      borderWidth: 1.5,
      borderColor: CARPOOL_SITE.fog,
      backgroundColor: CARPOOL_SITE.surfaceMuted,
    },
    actionText: {
      fontWeight: '800',
      color: CARPOOL_SITE.asphalt,
      fontSize: 12,
    },
    actionGhostText: {
      fontWeight: '800',
      color: CARPOOL_SITE.ink,
      fontSize: 12,
    },
  });
}
