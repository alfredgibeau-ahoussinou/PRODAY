import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { UserRole } from '../../models/User';
import { ProDayText } from '../ui/ProDayText';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { formatRelativeTime } from '../../utils/formatRelativeTime';

export function weeklyQuestionRoleLabel(
  role: UserRole | undefined,
  t: (key: string) => string
): string {
  if (!role) return '';
  const key = `role.${role}`;
  const value = t(key);
  return value === key ? role : value;
}

export function WeeklyQuestionAvatar({
  name,
  colors: c,
  size = 40,
}: {
  name: string;
  colors: AppColors;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: c.brandSoft,
        },
      ]}
    >
      <ProDayText
        variant="caption"
        style={{ color: c.brand, fontWeight: '800', fontSize: size * 0.38 }}
      >
        {name.charAt(0).toUpperCase()}
      </ProDayText>
    </View>
  );
}

export function WeeklyQuestionResponseRow({
  name,
  role,
  body,
  createdAt,
  colors: c,
  t,
  locale,
  highlight,
}: {
  name: string;
  role?: string;
  body: string;
  createdAt?: Date;
  colors: AppColors;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: string;
  highlight?: boolean;
}) {
  const meta = [role, createdAt ? formatRelativeTime(createdAt, t, new Date(), locale) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: c.border,
          backgroundColor: highlight ? c.brandSoft : c.surface,
          borderColor: c.border,
        },
        highlight ? styles.rowHighlight : null,
      ]}
    >
      <WeeklyQuestionAvatar name={name} colors={c} />
      <View style={styles.rowBody}>
        <View style={styles.rowHead}>
          <ProDayText variant="caption" style={[styles.rowName, { color: c.text }]}>
            {name}
          </ProDayText>
          {meta ? (
            <ProDayText variant="caption" muted numberOfLines={1} style={styles.rowMeta}>
              {meta}
            </ProDayText>
          ) : null}
        </View>
        <ProDayText variant="body" style={[styles.rowText, { color: c.text }]}>
          {body}
        </ProDayText>
      </View>
    </View>
  );
}

export function WeeklyQuestionPinnedCard({
  question,
  weekKey,
  hint,
  colors: c,
  t,
}: {
  question: string;
  weekKey: string;
  hint?: string;
  colors: AppColors;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  return (
    <View style={[styles.pinned, { borderBottomColor: c.border, backgroundColor: c.surface }]}>
      <View style={styles.pinnedHead}>
        <View style={[styles.adminAvatar, { backgroundColor: c.brand }]}>
          <ProDayText variant="caption" inverse style={styles.adminAvatarText}>
            P
          </ProDayText>
        </View>
        <View style={styles.pinnedMeta}>
          <ProDayText variant="caption" style={[styles.pinnedName, { color: c.text }]}>
            {t('feed.weekly.byAdmin')}
          </ProDayText>
          <ProDayText variant="caption" muted>
            {t('feed.weekly.weekLabel', { n: weekKey })}
          </ProDayText>
        </View>
        <View style={[styles.badge, { backgroundColor: c.brandSoft }]}>
          <ProDayText variant="caption" style={[styles.badgeText, { color: c.brand }]}>
            {t('feed.weekly.badge')}
          </ProDayText>
        </View>
      </View>
      <ProDayText variant="title" style={[styles.question, { color: c.text }]}>
        {question}
      </ProDayText>
      {hint ? (
        <ProDayText variant="caption" muted style={styles.hint}>
          {hint}
        </ProDayText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  rowHighlight: {
    borderWidth: 1.5,
  },
  rowBody: { flex: 1, gap: 4 },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  rowName: { fontWeight: '800' },
  rowMeta: { flexShrink: 1 },
  rowText: { lineHeight: 22 },
  pinned: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pinnedHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pinnedMeta: { flex: 1, gap: 2 },
  pinnedName: { fontWeight: '800' },
  adminAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatarText: { fontWeight: '900', fontSize: 15 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { fontWeight: '800', fontSize: 11, letterSpacing: 0.3 },
  question: { lineHeight: 28, fontSize: 20 },
  hint: { lineHeight: 20 },
});
