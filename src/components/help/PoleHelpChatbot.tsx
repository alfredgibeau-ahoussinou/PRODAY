import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { usePoleHelpChatbot } from '../../hooks/usePoleHelpChatbot';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import {
  getPoleHelpQuickSuggestions,
  type PoleHelpEntry,
  type PoleHelpNavigateAction,
} from '../../content/poleHelpContent';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

type ChatBubble = {
  id: string;
  role: 'bot' | 'user';
  text: string;
  entry?: PoleHelpEntry;
};

function executePoleHelpNavigate(
  action: PoleHelpNavigateAction,
  nav: ReturnType<typeof useTabNavigationActions>,
): void {
  switch (action.kind) {
    case 'tab':
      nav.setActiveTab(action.tab);
      break;
    case 'matchs':
      nav.openMatchs(action.homeTab ? { homeTab: action.homeTab } : undefined);
      break;
    case 'mercato':
      nav.openMercato(action.view);
      break;
    case 'profile':
      nav.openProfile(action.view);
      break;
    case 'dashboard':
      nav.openDashboard(action.view);
      break;
    case 'shop':
      nav.openShop();
      break;
    default:
      break;
  }
}

export const PoleHelpChatbot: React.FC = () => {
  const { colors, productLine } = useAppTheme();
  const { visible, content, usesBriefcaseIcon } = usePoleHelpChatbot(productLine);
  const nav = useTabNavigationActions();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatBubble[]>([]);

  const quickSuggestions = useMemo(
    () => getPoleHelpQuickSuggestions(content),
    [content],
  );

  const resetConversation = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'bot',
        text: content.welcome,
      },
    ]);
  }, [content.welcome]);

  useEffect(() => {
    if (open) resetConversation();
  }, [open, resetConversation]);

  const handleSuggestion = useCallback(
    (entry: PoleHelpEntry) => {
      setMessages((prev) => [
        ...prev,
        { id: `q-${entry.id}`, role: 'user', text: entry.question },
        { id: `a-${entry.id}`, role: 'bot', text: entry.answer, entry },
      ]);
    },
    [],
  );

  const handleNavigate = useCallback(
    (entry: PoleHelpEntry) => {
      if (!entry.navigate) return;
      executePoleHelpNavigate(entry.navigate, nav);
      setOpen(false);
    },
    [nav],
  );

  if (!visible) return null;

  const fabIcon = usesBriefcaseIcon ? 'briefcase' : 'football';

  return (
    <>
      <PressableSpring
        style={styles.fab}
        onPress={() => setOpen(true)}
        scaleTo={0.92}
        haptic
        accessibilityRole="button"
        accessibilityLabel="Aide Pro Day"
      >
        <Icon name={fabIcon} size={24} color={colors.brandInverse} variant="filled" />
      </PressableSpring>

      <AnimatedModalShell
        visible={open}
        onClose={() => setOpen(false)}
        closeLabel="Fermer"
      >
        <View style={styles.sheetHeader}>
          <View style={[styles.headerIcon, { backgroundColor: colors.brandSoft }]}>
            <Icon name={fabIcon} size={22} color={colors.brand} variant="filled" />
          </View>
          <View style={styles.headerCopy}>
            <ProDayText variant="section">{content.title}</ProDayText>
            <ProDayText variant="caption" muted>
              Guide rapide — pas d’IA, réponses instantanées
            </ProDayText>
          </View>
        </View>

        <ScrollView
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.bubbleRow,
                msg.role === 'user' ? styles.bubbleRowUser : styles.bubbleRowBot,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  msg.role === 'user'
                    ? { backgroundColor: colors.brand, borderColor: colors.brand }
                    : { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    { color: msg.role === 'user' ? colors.brandInverse : colors.text },
                  ]}
                >
                  {msg.text}
                </Text>
                {msg.entry?.navigate ? (
                  <PressableSpring
                    style={[styles.navBtn, { backgroundColor: colors.brandSoft }]}
                    onPress={() => handleNavigate(msg.entry!)}
                    scaleTo={0.97}
                    haptic
                  >
                    <ProDayText variant="caption" accent>
                      {msg.entry.navigateLabel ?? 'Y aller'}
                    </ProDayText>
                    <Icon name="chevron-forward" size={14} color={colors.brand} />
                  </PressableSpring>
                ) : null}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.suggestions, { borderTopColor: colors.border }]}>
          <ProDayText variant="caption" muted style={styles.suggestionsLabel}>
            Questions fréquentes
          </ProDayText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsRow}
          >
            {quickSuggestions.map((entry) => (
              <PressableSpring
                key={entry.id}
                style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => handleSuggestion(entry)}
                scaleTo={0.97}
                haptic
              >
                <ProDayText variant="caption">{entry.question}</ProDayText>
              </PressableSpring>
            ))}
          </ScrollView>
        </View>
      </AnimatedModalShell>
    </>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    fab: {
      position: 'absolute',
      right: spacing.lg,
      bottom: TAB_BAR_CONTENT_INSET + spacing.sm,
      width: 52,
      height: 52,
      borderRadius: radius.pill,
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 40,
      ...shadows.fab,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    headerIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCopy: { flex: 1, gap: 2 },
    messages: { flex: 1 },
    messagesContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    bubbleRow: { flexDirection: 'row' },
    bubbleRowBot: { justifyContent: 'flex-start' },
    bubbleRowUser: { justifyContent: 'flex-end' },
    bubble: {
      maxWidth: '88%',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: 1,
      gap: spacing.sm,
    },
    bubbleText: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
    navBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.md,
    },
    suggestions: {
      borderTopWidth: 1,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    suggestionsLabel: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    suggestionsRow: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    chip: {
      maxWidth: 260,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
  });
}
