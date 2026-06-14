import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import type { MessageThread } from '../../lib/firestoreMappers';
import { Icon } from '../ui/Icon';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius, shadows } from '../../theme/designTokens';

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
  const isTeamGroup = thread.thread_kind === 'team_group';
  const initial = thread.participant_name.charAt(0).toUpperCase();
  const unread = Boolean(thread.unread);

  const avatarContent = isTeamGroup ? (
    <Icon name="people" size={20} color={colors.text} />
  ) : (
    <ProDayText variant="title" style={{ color: unread ? colors.text : colors.text }}>
      {initial}
    </ProDayText>
  );

  return (
    <PressableSpring
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: unread ? colors.accentMuted : colors.border,
        },
        unread && styles.rowUnread,
        shadows.soft,
      ]}
      onPress={onPress}
      disabled={disabled}
      haptic
      scaleTo={0.96}
    >
      {unread ? (
        <ProDayGradient kind="cta" style={styles.avatarRing}>
          <View style={[styles.avatar, { backgroundColor: colors.ink }]}>
            {isTeamGroup ? (
              <Icon name="people" size={20} color={colors.surface} />
            ) : (
              <ProDayText variant="title" inverse style={styles.avatarText}>
                {initial}
              </ProDayText>
            )}
          </View>
        </ProDayGradient>
      ) : (
        <View style={[styles.avatar, { backgroundColor: colors.surfaceMuted }]}>
          {avatarContent}
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.nameRow}>
            <ProDayText variant="section" numberOfLines={1} style={styles.name}>
              {thread.participant_name}
            </ProDayText>
            {kineLabel ? (
              <View style={[styles.kineBadge, { backgroundColor: colors.accentSoft }]}>
                <ProDayText variant="caption" accent style={styles.kineText}>
                  {kineLabel}
                </ProDayText>
              </View>
            ) : null}
          </View>
          <ProDayText variant="caption" muted>
            {formatThreadTime(thread.updated_at)}
          </ProDayText>
        </View>
        <ProDayText
          variant="body"
          muted={!unread}
          accent={unread}
          numberOfLines={1}
          style={unread ? styles.previewUnread : styles.preview}
        >
          {thread.last_message || 'Nouvelle conversation'}
        </ProDayText>
      </View>

      {unread ? (
        <View style={[styles.unreadDot, { backgroundColor: colors.accent }]}>
          <Icon name="chat" size={10} color="#FFFFFF" variant="filled" />
        </View>
      ) : (
        <Icon name="chevron-forward" size={16} color={colors.textMuted} />
      )}
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  rowUnread: {
    borderWidth: 1.5,
  },
  avatarRing: {
    padding: 2,
    borderRadius: 26,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18 },
  body: { flex: 1, minWidth: 0 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  name: { fontSize: 15, flexShrink: 1 },
  kineBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  kineText: { fontSize: 9, fontWeight: '900' },
  preview: { marginTop: 4 },
  previewUnread: { marginTop: 4, fontWeight: '600' },
  unreadDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
