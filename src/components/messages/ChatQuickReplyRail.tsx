import React, { useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet, Platform } from 'react-native';
import type { ChatQuickReply } from '../../core/social/chatQuickReply.engine';
import { PressableSpring } from '../motion';
import { Icon, type IconName } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';

interface ChatQuickReplyRailProps {
  replies: ChatQuickReply[];
  onSelect: (text: string) => void;
}

export const ChatQuickReplyRail: React.FC<ChatQuickReplyRailProps> = ({
  replies,
  onSelect,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (replies.length === 0) return null;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textMuted }]}>Réponses rapides</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
        keyboardShouldPersistTaps="handled"
      >
        {replies.map((reply) => (
          <PressableSpring
            key={reply.id}
            style={[
              styles.chip,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadows.soft,
            ]}
            onPress={() => onSelect(reply.text)}
            scaleTo={0.97}
            haptic
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
              <Icon name={reply.icon as IconName} size={14} color={colors.accent} />
            </View>
            <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={2}>
              {reply.text}
            </Text>
          </PressableSpring>
        ))}
      </ScrollView>
    </View>
  );
};

function createStyles(c: { textMuted: string }) {
  return StyleSheet.create({
    wrap: {
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
      gap: spacing.xs,
    },
    label: {
      fontFamily: fontFamily.bold,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      paddingHorizontal: spacing.lg,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    rail: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: 2,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      maxWidth: 220,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipText: {
      flexShrink: 1,
      fontFamily: fontFamily.semibold,
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 18,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
