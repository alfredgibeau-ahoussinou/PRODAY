import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import type { MessageThread } from '../../lib/firestoreMappers';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { useCoachTokens } from '../../features/coach/shell/CoachThemeContext';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { spacing, radius } from '../../theme/designTokens';

export type MessageRequestsPanelProps = {
  pendingThreads: MessageThread[];
  loading?: boolean;
  currentUid: string;
  onAccept: (threadId: string) => void;
  onRefuse: (threadId: string) => void;
  onOpen: (threadId: string) => void;
  variant?: 'default' | 'coach' | 'joueur';
};

/** Demandes joueur ↔ agent en attente (style Instagram). */
export function MessageRequestsPanel({
  pendingThreads,
  loading,
  currentUid,
  onAccept,
  onRefuse,
  onOpen,
  variant,
}: MessageRequestsPanelProps) {
  const { colors } = useAppTheme();
  const coach = variant === 'coach';
  const joueur = variant === 'joueur';
  const coachTokens = useCoachTokens();
  const joueurTheme = useJoueurTheme();
  const accent = coach ? coachTokens.accent : joueur ? joueurTheme.accent : colors.accent;

  if (loading) {
    return <ActivityIndicator color={accent} style={{ marginVertical: spacing.md }} />;
  }
  if (pendingThreads.length === 0) return null;

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
      <ProDayText variant="section" style={{ color: colors.text, marginBottom: spacing.xs }}>
        Demandes de message
      </ProDayText>
      <ProDayText variant="caption" muted style={styles.hint}>
        Conversation active uniquement après acceptation.
      </ProDayText>
      {pendingThreads.map((thread) => {
        const canResolve = thread.request_recipient_uid === currentUid;
        return (
          <View
            key={thread.id}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <PressableSpring onPress={() => onOpen(thread.id)} scaleTo={0.98} style={styles.copy}>
              <ProDayText variant="body" style={{ color: colors.text, fontWeight: '700' }}>
                {thread.participant_name}
              </ProDayText>
              <ProDayText variant="caption" muted numberOfLines={2}>
                {thread.last_message || 'Souhaite démarrer une conversation.'}
              </ProDayText>
            </PressableSpring>
            {canResolve ? (
              <View style={styles.actions}>
                <PressableSpring
                  onPress={() => onRefuse(thread.id)}
                  scaleTo={0.96}
                  haptic
                  style={[styles.btn, { borderColor: colors.border }]}
                >
                  <ProDayText variant="caption" muted>
                    Refuser
                  </ProDayText>
                </PressableSpring>
                <PressableSpring
                  onPress={() => onAccept(thread.id)}
                  scaleTo={0.96}
                  haptic
                  style={[styles.btn, styles.btnPrimary, { backgroundColor: accent }]}
                >
                  <ProDayText
                    variant="caption"
                    style={{ color: colors.brandInverse, fontWeight: '700' }}
                  >
                    Accepter
                  </ProDayText>
                </PressableSpring>
              </View>
            ) : (
              <ProDayText
                variant="caption"
                accent={!joueur}
                style={[styles.waiting, joueur ? { color: accent } : undefined]}
              >
                En attente
              </ProDayText>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  hint: { marginBottom: spacing.xs, lineHeight: 16 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  copy: { gap: 2 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnPrimary: { borderWidth: 0 },
  waiting: { alignSelf: 'flex-end', fontWeight: '600' },
});
