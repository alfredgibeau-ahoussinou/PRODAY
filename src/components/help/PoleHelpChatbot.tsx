import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { usePoleHelpChatbot } from '../../hooks/usePoleHelpChatbot';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import {
  getPoleHelpQuickSuggestions,
  getPoleHelpQuestionCount,
  groupPoleHelpEntriesByCategory,
  POLE_HELP_OTHER_QUESTION,
  type PoleHelpCategory,
  type PoleHelpEntry,
  type PoleHelpNavigateAction,
} from '../../content/poleHelpContent';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing, radius, shadows, brandOverlay } from '../../theme/designTokens';
import { motion } from '../../theme/motion';
import type { AppColors } from '../../theme/universeTheme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ChatBubble = {
  id: string;
  role: 'bot' | 'user';
  text: string;
  entry?: PoleHelpEntry;
  time: string;
};

function formatChatTime(date = new Date()): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

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

const FAB_SIZE = 46;

function PoleHelpIcon({
  usesBriefcaseIcon,
  size = 20,
  color,
}: {
  usesBriefcaseIcon: boolean;
  size?: number;
  color: string;
}) {
  return (
    <Ionicons
      name={usesBriefcaseIcon ? 'briefcase-outline' : 'football-outline'}
      size={size}
      color={color}
    />
  );
}

const ChatMessage: React.FC<{
  msg: ChatBubble;
  index: number;
  colors: AppColors;
  styles: ReturnType<typeof createStyles>;
  usesBriefcaseIcon: boolean;
  onNavigate: (entry: PoleHelpEntry) => void;
}> = ({ msg, index, colors, styles, usesBriefcaseIcon, onNavigate }) => (
  <AnimatedEntrance kind="fadeUp" index={index} delayStep={40}>
    <View
      style={[
        styles.bubbleRow,
        msg.role === 'user' ? styles.bubbleRowUser : styles.bubbleRowBot,
      ]}
    >
      {msg.role === 'bot' ? (
        <View style={[styles.botAvatar, { backgroundColor: colors.brandSoft }]}>
          <PoleHelpIcon usesBriefcaseIcon={usesBriefcaseIcon} size={12} color={colors.brand} />
        </View>
      ) : null}
      <View style={styles.bubbleColumn}>
        {msg.role === 'user' ? (
          <View
            style={[
              styles.bubble,
              styles.bubbleUser,
              { backgroundColor: colors.brand, borderColor: brandOverlay(0.3) },
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
                borderColor: brandOverlay(0.18),
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
                <View style={[styles.navBtn, { backgroundColor: colors.brandSoft }]}>
                  <ProDayText variant="caption" style={[styles.navBtnText, { color: colors.brand }]}>
                    {msg.entry.navigateLabel ?? 'Y aller'}
                  </ProDayText>
                  <Icon name="chevron-forward" size={14} color={colors.brand} />
                </View>
              </PressableSpring>
            ) : null}
          </View>
        )}
        <Text
          style={[
            styles.bubbleTime,
            { color: colors.textMuted },
            msg.role === 'user' ? styles.bubbleTimeUser : styles.bubbleTimeBot,
          ]}
        >
          {msg.time}
        </Text>
      </View>
    </View>
  </AnimatedEntrance>
);

const CategoryAccordion: React.FC<{
  category: PoleHelpCategory;
  label: string;
  entries: PoleHelpEntry[];
  open: boolean;
  query: string;
  colors: AppColors;
  styles: ReturnType<typeof createStyles>;
  onToggle: () => void;
  onSelect: (entry: PoleHelpEntry) => void;
}> = ({ label, entries, open, query, colors, styles, onToggle, onSelect }) => {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) => e.question.toLowerCase().includes(q) || e.answer.toLowerCase().includes(q),
    );
  }, [entries, query]);

  if (filtered.length === 0 && query.trim()) return null;

  return (
    <View style={[styles.accordionWrap, open && { borderColor: brandOverlay(0.35) }]}>
      <PressableSpring style={styles.accordionHead} onPress={onToggle} scaleTo={0.98} haptic>
        <View style={[styles.accordionDot, { backgroundColor: colors.brand }]} />
        <ProDayText variant="caption" style={styles.accordionTitle}>
          {label}
        </ProDayText>
        <View style={[styles.accordionCount, { backgroundColor: colors.brandSoft }]}>
          <ProDayText variant="caption" style={[styles.accordionCountText, { color: colors.brand }]}>
            {filtered.length}
          </ProDayText>
        </View>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
      </PressableSpring>
      {open ? (
        <View style={styles.accordionBody}>
          {filtered.map((entry) => (
            <PressableSpring
              key={entry.id}
              style={[styles.questionRow, { borderColor: colors.border }]}
              onPress={() => onSelect(entry)}
              scaleTo={0.98}
              haptic
            >
              <ProDayText variant="caption" style={styles.questionRowText}>
                {entry.question}
              </ProDayText>
              <Icon name="chevron-forward" size={14} color={colors.brand} />
            </PressableSpring>
          ))}
        </View>
      ) : null}
    </View>
  );
};

export const PoleHelpChatbot: React.FC = () => {
  const { colors, productLine } = useAppTheme();
  const { visible, content, usesBriefcaseIcon, showBubble, dismissBubble } =
    usePoleHelpChatbot(productLine);
  const nav = useTabNavigationActions();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [query, setQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<PoleHelpCategory>>(
    () => new Set(['navigation']),
  );
  const scrollRef = useRef<ScrollView>(null);
  const pulse = useSharedValue(1);

  const questionCount = useMemo(() => getPoleHelpQuestionCount(content), [content]);
  const categoryGroups = useMemo(() => groupPoleHelpEntriesByCategory(content), [content]);
  const quickSuggestions = useMemo(() => getPoleHelpQuickSuggestions(content), [content]);

  const openChat = useCallback(() => {
    setOpen(true);
  }, []);

  const resetConversation = useCallback(() => {
    setQuery('');
    setOpenCategories(new Set(['navigation']));
    setMessages([
      {
        id: 'welcome',
        role: 'bot',
        text: content.welcome,
        time: formatChatTime(),
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
        withTiming(1.08, { duration: 1400, easing: motion.easing.inOut }),
        withTiming(1, { duration: 1400, easing: motion.easing.inOut }),
      ),
      -1,
      false,
    );
  }, [visible, open, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + (pulse.value - 1) * 1.2,
    transform: [{ scale: pulse.value }],
  }));

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [messages, open]);

  const handleSuggestion = useCallback((entry: PoleHelpEntry) => {
    const time = formatChatTime();
    setMessages((prev) => [
      ...prev,
      { id: `q-${entry.id}-${Date.now()}`, role: 'user', text: entry.question, time },
      { id: `a-${entry.id}-${Date.now()}`, role: 'bot', text: entry.answer, entry, time },
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

  const toggleCategory = useCallback((category: PoleHelpCategory) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  if (!visible) return null;

  const bubbleVisible = showBubble && !open;
  const filteredOtherVisible =
    !query.trim() ||
    POLE_HELP_OTHER_QUESTION.question.toLowerCase().includes(query.trim().toLowerCase()) ||
    POLE_HELP_OTHER_QUESTION.answer.toLowerCase().includes(query.trim().toLowerCase());

  return (
    <>
      <View style={styles.fabAnchor} pointerEvents="box-none">
        {bubbleVisible ? (
          <AnimatedEntrance kind="fadeUp" index={0}>
            <View style={styles.teaserWrap}>
              <PressableSpring
                onPress={openChat}
                scaleTo={0.98}
                haptic
                style={[
                  styles.teaserBubble,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={content.bubbleTeaser}
              >
                <View style={[styles.teaserDot, { backgroundColor: colors.brand }]} />
                <ProDayText variant="caption" style={[styles.teaserText, { color: colors.text }]}>
                  {content.bubbleTeaser}
                </ProDayText>
                <View style={[styles.teaserTail, { borderTopColor: colors.surface }]} />
              </PressableSpring>
              <PressableSpring
                onPress={dismissBubble}
                scaleTo={0.9}
                haptic
                style={[styles.teaserClose, { backgroundColor: colors.surface, borderColor: colors.border }]}
                accessibilityRole="button"
                accessibilityLabel="Fermer l’invite d’aide"
              >
                <Icon name="close" size={11} color={colors.textMuted} />
              </PressableSpring>
            </View>
          </AnimatedEntrance>
        ) : null}

        <Animated.View
          pointerEvents="none"
          style={[styles.fabPulse, { borderColor: brandOverlay(0.35) }, pulseStyle]}
        />
        <PressableSpring
          style={styles.fabPressable}
          onPress={openChat}
          scaleTo={0.94}
          haptic
          accessibilityRole="button"
          accessibilityLabel="Aide Pro Day"
        >
          <View
            style={[
              styles.fabCircle,
              {
                backgroundColor: colors.surface,
                borderColor: brandOverlay(0.28),
              },
            ]}
          >
            <PoleHelpIcon usesBriefcaseIcon={usesBriefcaseIcon} size={20} color={colors.brand} />
          </View>
        </PressableSpring>
      </View>

      <AnimatedModalShell
        visible={open}
        onClose={() => setOpen(false)}
        closeLabel="Fermer"
        variant="compact"
      >
        <View style={[styles.sheetHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerRow}>
            <View style={[styles.headerIcon, { backgroundColor: colors.brandSoft }]}>
              <PoleHelpIcon usesBriefcaseIcon={usesBriefcaseIcon} size={16} color={colors.brand} />
            </View>
            <View style={styles.headerCopy}>
              <ProDayText variant="section" style={styles.headerTitle}>
                {content.title}
              </ProDayText>
              <ProDayText variant="caption" muted style={styles.headerSubtitle}>
                {questionCount} questions · réponses instantanées
              </ProDayText>
            </View>
          </View>
        </View>

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
              usesBriefcaseIcon={usesBriefcaseIcon}
              onNavigate={handleNavigate}
            />
          ))}

          {messages.length <= 1 ? (
            <AnimatedEntrance kind="fadeUp" index={1}>
              <View style={styles.inlineSuggestions}>
                <ProDayText variant="caption" muted style={styles.inlineSuggestionsLabel}>
                  Suggestions rapides
                </ProDayText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestionsRow}
                >
                  {quickSuggestions.map((entry) => (
                    <PressableSpring
                      key={entry.id}
                      style={[
                        styles.quickChip,
                        { borderColor: brandOverlay(0.25), backgroundColor: colors.brandSoft },
                      ]}
                      onPress={() => handleSuggestion(entry)}
                      scaleTo={0.96}
                      haptic
                    >
                      <ProDayText variant="caption" style={[styles.quickChipText, { color: colors.brand }]}>
                        {entry.question}
                      </ProDayText>
                    </PressableSpring>
                  ))}
                </ScrollView>
              </View>
            </AnimatedEntrance>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.questionsPanel,
            { borderTopColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <View style={styles.questionsPanelHead}>
            <ProDayText variant="caption" muted style={styles.questionsPanelLabel}>
              Parcourir les questions
            </ProDayText>
            <View style={[styles.searchWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Icon name="search" size={14} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Rechercher…"
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.text }]}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>
          </View>

          <ScrollView
            style={styles.accordionScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.accordionContent}
            keyboardShouldPersistTaps="handled"
          >
            {categoryGroups.map((group) => (
              <CategoryAccordion
                key={group.category}
                category={group.category}
                label={group.label}
                entries={group.entries}
                open={openCategories.has(group.category)}
                query={query}
                colors={colors}
                styles={styles}
                onToggle={() => toggleCategory(group.category)}
                onSelect={handleSuggestion}
              />
            ))}

            {filteredOtherVisible ? (
              <PressableSpring
                style={[styles.otherQuestion, { borderColor: colors.brand, backgroundColor: brandOverlay(0.08) }]}
                onPress={() => handleSuggestion(POLE_HELP_OTHER_QUESTION)}
                scaleTo={0.98}
                haptic
              >
                <Icon name="mail" size={16} color={colors.brand} />
                <View style={styles.otherQuestionCopy}>
                  <ProDayText variant="caption" style={[styles.otherQuestionTitle, { color: colors.brand }]}>
                    {POLE_HELP_OTHER_QUESTION.question}
                  </ProDayText>
                  <ProDayText variant="caption" muted style={styles.otherQuestionHint}>
                    Contacter support@proday.app
                  </ProDayText>
                </View>
                <Icon name="chevron-forward" size={14} color={colors.brand} />
              </PressableSpring>
            ) : null}
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
      alignItems: 'flex-end',
      zIndex: 40,
    },
    teaserWrap: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs,
      marginBottom: spacing.sm,
      maxWidth: 240,
    },
    teaserBubble: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: 1,
      position: 'relative',
      ...shadows.soft,
    },
    teaserDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      flexShrink: 0,
    },
    teaserText: { flex: 1, fontWeight: '600', lineHeight: 17, fontSize: 12 },
    teaserTail: {
      position: 'absolute',
      bottom: -6,
      right: spacing.md + 4,
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: 7,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
    },
    teaserClose: {
      width: 22,
      height: 22,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      marginTop: 2,
    },
    fabPulse: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: FAB_SIZE / 2,
      borderWidth: 1.5,
    },
    fabPressable: {
      borderRadius: FAB_SIZE / 2,
      ...shadows.fab,
    },
    fabCircle: {
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: FAB_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    sheetHeader: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerIcon: {
      width: 30,
      height: 30,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCopy: { flex: 1, gap: 1 },
    headerTitle: { fontWeight: '800', fontSize: 15, letterSpacing: -0.2 },
    headerSubtitle: { fontWeight: '600', fontSize: 11 },
    messages: { flex: 1 },
    messagesContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    inlineSuggestions: { gap: spacing.sm, marginTop: spacing.xs },
    inlineSuggestionsLabel: {
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      fontSize: 10,
    },
    suggestionsRow: { gap: spacing.sm, paddingRight: spacing.lg },
    quickChip: {
      maxWidth: 220,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    quickChipText: { fontWeight: '700' },
    bubbleRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    bubbleRowBot: { justifyContent: 'flex-start' },
    bubbleRowUser: { justifyContent: 'flex-end' },
    botAvatar: {
      width: 22,
      height: 22,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    bubbleColumn: { maxWidth: '82%', gap: 3 },
    bubble: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      gap: spacing.sm,
    },
    bubbleBot: {
      borderRadius: radius.lg,
      borderTopLeftRadius: radius.sm,
      borderWidth: 1,
      ...shadows.soft,
    },
    bubbleUser: {
      borderRadius: radius.lg,
      borderTopRightRadius: radius.sm,
      borderWidth: 1,
      alignSelf: 'flex-end',
    },
    bubbleText: { fontSize: 14, lineHeight: 21, fontWeight: '600' },
    bubbleTime: { fontSize: 10, fontWeight: '600' },
    bubbleTimeBot: { alignSelf: 'flex-start', marginLeft: spacing.xs },
    bubbleTimeUser: { alignSelf: 'flex-end', marginRight: spacing.xs },
    navBtnWrap: { alignSelf: 'flex-start' },
    navBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
    },
    navBtnText: { fontWeight: '800' },
    questionsPanel: {
      borderTopWidth: 1,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      maxHeight: 200,
      flexShrink: 0,
    },
    questionsPanelHead: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    questionsPanelLabel: {
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      fontSize: 10,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      paddingVertical: 0,
    },
    accordionScroll: { flexGrow: 0 },
    accordionContent: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      paddingBottom: spacing.xs,
    },
    accordionWrap: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      overflow: 'hidden',
    },
    accordionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    accordionDot: { width: 6, height: 6, borderRadius: 3 },
    accordionTitle: { flex: 1, fontWeight: '800', color: c.text },
    accordionCount: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
      minWidth: 22,
      alignItems: 'center',
    },
    accordionCountText: { fontWeight: '800', fontSize: 10 },
    accordionBody: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingVertical: spacing.xs,
    },
    questionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    questionRowText: { flex: 1, fontWeight: '600', color: c.text, lineHeight: 18 },
    otherQuestion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
      marginTop: spacing.xs,
    },
    otherQuestionCopy: { flex: 1, gap: 2 },
    otherQuestionTitle: { fontWeight: '800' },
    otherQuestionHint: { fontSize: 11 },
  });
}
