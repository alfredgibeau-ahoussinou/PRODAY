import React, { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring } from '../motion';
import { Icon, type IconName } from '../ui/Icon';
import { AdminButton } from './AdminButton';
import { adminChrome, adminType, ADMIN_ON_ACCENT } from '../../theme/adminTheme';
import { spacing } from '../../theme/designTokens';

export type AdminIntelCardTone = 'default' | 'accent' | 'warn' | 'danger' | 'success';

type Props = {
  kicker?: string;
  title: string;
  body?: string;
  meta?: string;
  icon?: IconName;
  tone?: AdminIntelCardTone;
  cta?: { label: string; onPress: () => void };
  onPress?: () => void;
  children?: React.ReactNode;
  style?: ViewStyle;
};

const TONE_BORDER: Record<AdminIntelCardTone, string> = {
  default: adminChrome.shellBorder,
  accent: adminChrome.accentMuted,
  warn: 'rgba(245, 158, 11, 0.4)',
  danger: 'rgba(244, 63, 94, 0.4)',
  success: 'rgba(34, 197, 94, 0.35)',
};

export function AdminIntelCard({
  kicker,
  title,
  body,
  meta,
  icon,
  tone = 'default',
  cta,
  onPress,
  children,
  style,
}: Props) {
  const styles = useMemo(() => createStyles(), []);
  const inner = (
    <View style={[styles.card, { borderColor: TONE_BORDER[tone] }, style]}>
      <LinearGradient
        colors={['rgba(0, 108, 252, 0.10)', 'rgba(10, 18, 32, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={styles.head}>
        {icon ? (
          <View style={styles.iconBox}>
            <Icon name={icon} size={16} color={adminChrome.accentHot} />
          </View>
        ) : null}
        <View style={styles.copy}>
          {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {body ? <Text style={styles.body}>{body}</Text> : null}
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>
      </View>
      {children}
      {cta ? (
        <AdminButton label={cta.label} variant="outline" size="sm" onPress={cta.onPress} />
      ) : null}
    </View>
  );

  if (!onPress) return inner;
  return (
    <PressableSpring onPress={onPress} scaleTo={0.98} haptic>
      {inner}
    </PressableSpring>
  );
}

export function AdminIntelBadge({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: AdminIntelCardTone;
}) {
  const bg =
    tone === 'danger'
      ? 'rgba(244, 63, 94, 0.16)'
      : tone === 'warn'
        ? 'rgba(245, 158, 11, 0.16)'
        : tone === 'success'
          ? adminChrome.pitchSoft
          : adminChrome.soft;
  const color =
    tone === 'danger'
      ? adminChrome.danger
      : tone === 'warn'
        ? adminChrome.warning
        : tone === 'success'
          ? adminChrome.pitch
          : adminChrome.accentHot;
  return (
    <View style={[badgeStyles.wrap, { backgroundColor: bg }]}>
      <Text style={[badgeStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: adminType.bodyExtra,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: ADMIN_ON_ACCENT,
  },
});

function createStyles() {
  return StyleSheet.create({
    card: {
      backgroundColor: adminChrome.glass,
      borderRadius: adminChrome.radiusLg,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.md,
      gap: spacing.sm,
      overflow: 'hidden',
      shadowColor: adminChrome.cardShadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 1,
      shadowRadius: 20,
      elevation: 4,
    },
    head: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: adminChrome.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: { flex: 1, minWidth: 0, gap: 4 },
    kicker: {
      color: adminChrome.accent,
      fontFamily: adminType.bodyExtra,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    title: {
      color: adminChrome.text,
      fontFamily: adminType.bodyExtra,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    body: {
      color: adminChrome.textSecondary,
      fontFamily: adminType.body,
      fontSize: 13,
      lineHeight: 19,
    },
    meta: {
      color: adminChrome.textMuted,
      fontFamily: adminType.body,
      fontSize: 12,
    },
  });
}
