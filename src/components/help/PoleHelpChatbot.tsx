import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { AnimatedEntrance, PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { FootIcon } from '../ui/footIcons/FootIcon';
import { ProDayGradient } from '../ui/ProDayGradient';
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
import { spacing, radius, shadows, brandOverlay } from '../../theme/designTokens';
import { motion } from '../../theme/motion';
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

function PoleHelpAvatar({
  usesBriefcaseIcon,
  size = 22,
  color,
  filled = true,
}: {
  usesBriefcaseIcon: boolean;
  size?: number;
  color: string;
  filled?: boolean;
}) {
  if (usesBriefcaseIcon) {
    return <FootIcon name="briefcase" size={size} color={color} filled={filled} />;
  }
  return <FootIcon name="football" size={size} color={color} filled={filled} />;
}

const ChatMessage: React.FC<{
  msg: ChatBubble;
  index: number;
  colors: AppColors;
  styles: ReturnType<typeof createStyles>;
  onNavigate: (entry: PoleHelpEntry) => void;
}> = ({ msg, index, colors, styles, onNavigate }) => (
  <AnimatedEntrance kind="fadeUp" index={index} delayStep={48}>
    <View
      style={[
        styles.bubbleRow,
        msg.role === 'user' ? styles.bubbleRowUser : styles.bubbleRowBot,
      ]}
    >
      {msg.role === 'bot' ? (
        <View style={[styles.botAvatar, { backgroundColor: colors.brandSoft }]}>
          <FootIcon name="chat" size={14} color={colors.brand} filled />
        </View>
      ) : null}
      {msg.role === 'user' ? (
        <View
          style={[
            styles.bubble,
            styles.bubbleUser,
            { backgroundColor: colors.brand, borderColor: colors.brand },
          ]}
        >
          <Text style={[styles.bubbleText, { color: colors.brandInverse }]}>{msg.text}</Text>
        </View>
      ) : (
        <View
          style={[
            styles.bubble,
            styles.bubbleBot,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              ...shadows.soft,
            },
          ]}
        >
          <Text style={[styles.bubbleText, { color: colors.text }]}>{msg.text}</Text>
          {msg.entry?.navigate ? (
            <PressableSpring
              onPress={() => onNavigate(msg.entry!)}
              scaleTo={0.97}
              haptic
              style={styles.navBtnWrap}
            >
              <ProDayGradient kind="cta" style={styles.navBtn}>
                <ProDayText variant="caption" style={styles.navBtnText}>
                  {msg.entry.navigateLabel ?? 'Y aller'}
                </ProDayText>
                <Icon name="chevron-forward" size={14} color={colors.brandInverse} />
              </ProDayGradient>
            </PressableSpring>
          ) : null}
        </View>
      )}
    </View>
  </AnimatedEntrance>
);

export const PoleHelpChatbot: React.FC = () => {
  const { colors, productLine } = useAppTheme();
  const { visible, content, usesBriefcaseIcon } = usePoleHelpChatbot(productLine);
  const nav = useTabNavigationActions();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const pulse = useSharedValue(1);

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

  useEffect(() => {
    if (!visible || open) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 1400, easing: motion.easing.inOut }),
        withTiming(1, { duration: 1400, easing: motion.easing.inOut }),
      ),
      -1,
      false,
    );
  }, [visible, open, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.22 + (pulse.value - 1) * 1.4,
    transform: [{ scale: pulse.value }],
  }));

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [messages, open]);

  const handleSuggestion = useCallback((entry: PoleHelpEntry) => {
    setMessages((prev) => [
      ...prev,
      { id: `q-${entry.id}`, role: 'user', text: entry.question },
      { id: `a-${entry.id}`, role: 'bot', text: entry.answer, entry },
    ]);
  }, []);

  const handleNavigate = useCallback(
    (entry: PoleHelpEntry) => {
      if (!entry.navigate) return;
      executePoleHelpNavigate(entry.navigate, nav);
      setOpen(false);
    },
    [nav],
  );

  if (!visible) return null;

  return (
    <>
      <View style={styles.fabAnchor} pointerEvents="box-none">
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fabPulse,
            { borderColor: colors.brand },
            pulseStyle,
          ]}
        />
        <PressableSpring
          style={styles.fabPressable}
          onPress={() => setOpen(true)}
          scaleTo={0.92}
          haptic
          accessibilityRole="button"
          accessibilityLabel="Aide Pro Day"
        >
          <ProDayGradient kind="cta" style={styles.fab}>
            <PoleHelpAvatar
              usesBriefcaseIcon={usesBriefcaseIcon}
              size={26}
              color={colors.brandInverse}
              filled
            />
          </ProDayGradient>
        </PressableSpring>
        <ProDayText variant="caption" style={[styles.fabLabel, { color: colors.brand }]}>
          Aide
        </ProDayText>
      </View>

      <AnimatedModalShell
        visible={open}
        onClose={() => setOpen(false)}
        closeLabel="Fermer"
      >
        <ProDayGradient kind="heroDark" style={styles.sheetHeader}>
          <View style={styles.headerGlow} />
          <View style={styles.headerRow}>
            <View style={styles.headerAvatarRing}>
              <ProDayGradient kind="cta" style={styles.headerAvatar}>
                <PoleHelpAvatar
                  usesBriefcaseIcon={usesBriefcaseIcon}
                  size={24}
                  color={colors.brandInverse}
                  filled
                />
              </ProDayGradient>
            </View>
            <View style={styles.headerCopy}>
              <ProDayText variant="section" style={styles.headerTitle}>
                Assistant ProDay
              </ProDayText>
              <ProDayText variant="caption" style={styles.headerSubtitle}>
                {content.title} · réponses instantanées
              </ProDayText>
            </View>
          </View>
        </ProDayGradient>

        <ScrollView
          ref={scrollRef}
          style={[styles.messages, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg, index) => (
            <ChatMessage
              key={msg.id}
              msg={msg}
              index={index}
              colors={colors}
              styles={styles}
              onNavigate={handleNavigate}
            />
          ))}
        </ScrollView>

        <View
          style={[
            styles.suggestions,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <ProDayText variant="caption" muted style={styles.suggestionsLabel}>
            Questions fréquentes
          </ProDayText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsRow}
          >
            {quickSuggestions.map((entry, index) => (
              <AnimatedEntrance key={entry.id} kind="fade" index={index} delayStep={40}>
                <PressableSpring
                  style={[
                    styles.chip,
                    {
                      borderColor: colors.borderMedium,
                      backgroundColor: colors.brandSoft,
                    },
                  ]}
                  onPress={() => handleSuggestion(entry)}
                  scaleTo={0.96}
                  haptic
                >
                  <ProDayText variant="caption" style={styles.chipText}>
                    {entry.question}
                  </ProDayText>
                </PressableSpring>
              </AnimatedEntrance>
            ))}
          </ScrollView>
        </View>
      </AnimatedModalShell>
    </>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    fabAnchor: {
      position: 'absolute',
      right: spacing.lg,
      bottom: TAB_BAR_CONTENT_INSET + spacing.xs,
      alignItems: 'center',
      zIndex: 40,
    },
    fabPulse: {
      position: 'absolute',
      top: 0,
      width: 58,
      height: 58,
      borderRadius: radius.pill,
      borderWidth: 2,
    },
    fabPressable: {
      borderRadius: radius.pill,
      ...shadows.fab,
    },
    fab: {
      width: 58,
      height: 58,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: brandOverlay(0.12),
    },
    fabLabel: {
      marginTop: spacing.xs,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    sheetHeader: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
      overflow: 'hidden',
    },
    headerGlow: {
      position: 'absolute',
      top: -40,
      right: -20,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: brandOverlay(0.18),
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    headerAvatarRing: {
      padding: 3,
      borderRadius: radius.pill,
      backgroundColor: brandOverlay(0.22),
    },
    headerAvatar: {
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCopy: { flex: 1, gap: 3 },
    headerTitle: {
      color: c.brandInverse,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      color: c.heroMuted,
      fontWeight: '600',
    },
    messages: { flex: 1 },
    messagesContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.md,
    },
    bubbleRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    bubbleRowBot: { justifyContent: 'flex-start' },
    bubbleRowUser: { justifyContent: 'flex-end' },
    botAvatar: {
      width: 28,
      height: 28,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    bubble: {
      maxWidth: '82%',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      gap: spacing.sm,
    },
    bubbleBot: {
      borderRadius: radius.lg,
      borderTopLeftRadius: radius.sm,
      borderWidth: 1,
    },
    bubbleUser: {
      borderRadius: radius.lg,
      borderTopRightRadius: radius.sm,
      borderWidth: 1,
      ...shadows.soft,
    },
    bubbleText: {
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '600',
    },
    navBtnWrap: { alignSelf: 'flex-start' },
    navBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      ...shadows.soft,
    },
    navBtnText: {
      color: c.brandInverse,
      fontWeight: '800',
    },
    suggestions: {
      borderTopWidth: 1,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
    },
    suggestionsLabel: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      fontSize: 10,
    },
    suggestionsRow: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    chip: {
      maxWidth: 240,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    chipText: {
      fontWeight: '700',
      color: c.text,
    },
  });
}
