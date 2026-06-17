import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import type { MessageThread } from '../../lib/firestoreMappers';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';

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
}

export const MessageThreadRow: React.FC<MessageThreadRowProps> = ({
  thread,
  kineLabel,
  onPress,
  disabled,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isTeamGroup = thread.thread_kind === 'team_group';
  const initial = thread.participant_name.charAt(0).toUpperCase();
  const unread = Boolean(thread.unread);

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

function createStyles(c: { accent: string }) {
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
  });
}
