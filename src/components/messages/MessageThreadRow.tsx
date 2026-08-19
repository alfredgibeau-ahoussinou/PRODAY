import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import type { MessageThread } from '../../lib/firestoreMappers';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';
import { useCoachTokens } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { FUT18_PREMIUM } from '../../theme/fut18PremiumPalette';

function formatThreadTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const dayMs = 86400000;
  if (diff < dayMs && now.getDate() === date.getDate()) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < dayMs * 2) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

interface MessageThreadRowProps {
  thread: MessageThread;
  kineLabel?: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'default' | 'coach' | 'joueur';
}

export const MessageThreadRow: React.FC<MessageThreadRowProps> = ({
  thread,
  kineLabel,
  onPress,
  disabled,
  variant,
}) => {
  const { colors } = useAppTheme();
  const coach = variant === 'coach';
  const joueur = variant === 'joueur';
  const coachTokens = useCoachTokens();
  const joueurTheme = useJoueurTheme();
  const styles = useMemo(
    () => createStyles(colors, coach, joueur, coachTokens, joueurTheme),
    [colors, coach, joueur, coachTokens, joueurTheme],
  );
  const isTeamGroup = thread.thread_kind === 'team_group';
  const initial = thread.participant_name.charAt(0).toUpperCase();
  const unread = Boolean(thread.unread);

  if (coach) {
    return (
      <PressableSpring
        onPress={onPress}
        disabled={disabled}
        haptic
        scaleTo={0.98}
        style={styles.coachCard}
      >
        <View style={styles.inner}>
          <View style={[styles.coachAvatar, unread && styles.coachAvatarUnread]}>
            {isTeamGroup ? (
              <Icon name="people" size={20} color={coachTokens.foreground} />
            ) : (
              <Text style={styles.coachInitial}>{initial}</Text>
            )}
          </View>
          <View style={styles.body}>
            <View style={styles.head}>
              <Text style={[styles.coachName, unread && styles.nameUnread]} numberOfLines={1}>
                {thread.participant_name}
              </Text>
              <Text style={styles.coachTime}>{formatThreadTime(thread.updated_at)}</Text>
            </View>
            <Text
              style={[styles.coachPreview, unread && styles.previewUnread]}
              numberOfLines={1}
            >
              {thread.last_message || 'Nouvelle conversation'}
            </Text>
            {kineLabel ? (
              <View style={styles.coachTag}>
                <Text style={styles.coachTagText}>{kineLabel}</Text>
              </View>
            ) : null}
          </View>
          {unread ? <View style={styles.coachDot} /> : null}
        </View>
      </PressableSpring>
    );
  }

  if (joueur) {
    const accent = joueurTheme.accent;
    return (
      <PressableSpring
        onPress={onPress}
        disabled={disabled}
        haptic
        scaleTo={0.98}
        style={[styles.joueurCard, unread && { borderColor: accent }]}
      >
        {unread ? <View style={[styles.stripe, { backgroundColor: accent }]} /> : null}
        <View style={styles.inner}>
          <View
            style={[
              styles.joueurAvatar,
              { backgroundColor: unread ? accent : FUT18_PREMIUM.chipBg },
            ]}
          >
            {isTeamGroup ? (
              <Icon name="people" size={20} color={unread ? '#fff' : accent} variant="filled" />
            ) : (
              <Text style={[styles.joueurInitial, { color: unread ? '#fff' : accent }]}>
                {initial}
              </Text>
            )}
          </View>
          <View style={styles.body}>
            <View style={styles.head}>
              <Text
                style={[styles.joueurName, unread && styles.nameUnread]}
                numberOfLines={1}
              >
                {thread.participant_name}
              </Text>
              <Text style={styles.joueurTime}>{formatThreadTime(thread.updated_at)}</Text>
            </View>
            <Text
              style={[styles.joueurPreview, unread && styles.previewUnread]}
              numberOfLines={2}
            >
              {thread.last_message || 'Nouvelle conversation'}
            </Text>
            {kineLabel ? (
              <View style={[styles.joueurTag, { backgroundColor: joueurTheme.surface }]}>
                <Text style={[styles.joueurTagText, { color: accent }]}>{kineLabel}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.trail}>
            {unread ? <View style={[styles.dot, { backgroundColor: accent }]} /> : null}
            <Icon name="chevron-forward" size={16} color={joueurTheme.inkMuted} />
          </View>
        </View>
      </PressableSpring>
    );
  }

  return (
    <PressableSpring
      onPress={onPress}
      disabled={disabled}
      haptic
      scaleTo={0.98}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: unread ? colors.accent : colors.border,
        },
        unread && styles.cardUnread,
      ]}
    >
      {unread ? <View style={[styles.stripe, { backgroundColor: colors.accent }]} /> : null}

      <View style={styles.inner}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: unread ? colors.accent : colors.accentSoft,
            },
          ]}
        >
          {isTeamGroup ? (
            <Icon
              name="people"
              size={22}
              color={unread ? colors.brandInverse : colors.accent}
              variant={unread ? 'filled' : 'outline'}
            />
          ) : (
            <Text
              style={[
                styles.initial,
                { color: unread ? colors.brandInverse : colors.accent },
              ]}
            >
              {initial}
            </Text>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.head}>
            <Text
              style={[
                styles.name,
                { color: colors.text },
                unread && styles.nameUnread,
              ]}
              numberOfLines={1}
            >
              {thread.participant_name}
            </Text>
            <Text style={[styles.time, { color: colors.textMuted }]}>
              {formatThreadTime(thread.updated_at)}
            </Text>
          </View>

          <Text
            style={[
              styles.preview,
              { color: unread ? colors.text : colors.textMuted },
              unread && styles.previewUnread,
            ]}
            numberOfLines={2}
          >
            {thread.last_message || 'Nouvelle conversation'}
          </Text>

          {kineLabel ? (
            <View style={[styles.tag, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.tagText, { color: colors.accent }]}>{kineLabel}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.trail}>
          {unread ? <View style={[styles.dot, { backgroundColor: colors.accent }]} /> : null}
          <Icon name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      </View>
    </PressableSpring>
  );
};

function createStyles(
  c: { accent: string },
  coach: boolean,
  joueur: boolean,
  coachTokens: CoachThemeTokens,
  joueurTheme: ReturnType<typeof useJoueurTheme>,
) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    cardUnread: {
      borderWidth: 1.5,
    },
    stripe: {
      height: 3,
      width: '100%',
    },
    inner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initial: {
      fontFamily: fontFamily.extrabold,
      fontSize: 18,
      fontWeight: '800',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    body: { flex: 1, minWidth: 0, gap: 4 },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    name: {
      flex: 1,
      fontFamily: fontFamily.extrabold,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.2,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    nameUnread: { fontWeight: '900' },
    time: {
      fontFamily: fontFamily.semibold,
      fontSize: 11,
      fontWeight: '600',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    preview: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      lineHeight: 18,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    previewUnread: {
      fontFamily: fontFamily.semibold,
      fontWeight: '600',
    },
    tag: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
      marginTop: 2,
    },
    tagText: {
      fontFamily: fontFamily.extrabold,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.3,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    trail: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingLeft: 2,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    coachCard: {
      borderRadius: 18,
      backgroundColor: coachTokens.surface,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    coachAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: coachTokens.elevated,
    },
    coachAvatarUnread: {
      backgroundColor: coachTokens.accent,
    },
    coachInitial: {
      fontFamily: fontFamily.extrabold,
      fontSize: 18,
      fontWeight: '800',
      color: coachTokens.foreground,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    coachName: {
      flex: 1,
      fontFamily: fontFamily.extrabold,
      fontSize: 16,
      fontWeight: '700',
      color: coachTokens.foreground,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    coachTime: {
      fontFamily: fontFamily.semibold,
      fontSize: 12,
      fontWeight: '600',
      color: coachTokens.muted,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    coachPreview: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
      lineHeight: 18,
      color: coachTokens.muted,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    coachTag: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
      marginTop: 2,
      backgroundColor: coachTokens.elevated,
    },
    coachTagText: {
      fontFamily: fontFamily.extrabold,
      fontSize: 10,
      fontWeight: '800',
      color: coachTokens.accent,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    coachDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: coachTokens.accent,
    },
    joueurCard: {
      borderRadius: joueurTheme.cardRadius,
      backgroundColor: FUT18_PREMIUM.panelBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: FUT18_PREMIUM.listBorder,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    joueurAvatar: {
      width: 48,
      height: 48,
      borderRadius: joueurTheme.cardRadius,
      alignItems: 'center',
      justifyContent: 'center',
    },
    joueurInitial: {
      fontFamily: fontFamily.extrabold,
      fontSize: 18,
      fontWeight: '800',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    joueurName: {
      flex: 1,
      fontFamily: fontFamily.extrabold,
      fontSize: 16,
      fontWeight: '800',
      color: joueurTheme.ink,
      letterSpacing: -0.2,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    joueurTime: {
      fontFamily: fontFamily.semibold,
      fontSize: 11,
      fontWeight: '600',
      color: joueurTheme.inkMuted,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    joueurPreview: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      lineHeight: 18,
      color: joueurTheme.inkMuted,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    joueurTag: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
      marginTop: 2,
    },
    joueurTagText: {
      fontFamily: fontFamily.extrabold,
      fontSize: 10,
      fontWeight: '800',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
