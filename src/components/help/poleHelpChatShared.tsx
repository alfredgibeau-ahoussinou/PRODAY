import React, { useMemo } from 'react';
import { View, StyleSheet, Text, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedEntrance, PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import {
  POLE_HELP_OTHER_QUESTION,
  type PoleHelpCategory,
  type PoleHelpEntry,
  type PoleHelpNavigateAction,
} from '../../content/poleHelpContent';
import { spacing, radius, shadows, brandOverlay } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

export type ChatBubble = {
  id: string;
  role: 'bot' | 'user';
  text: string;
  entry?: PoleHelpEntry;
  time: string;
};

export type PoleHelpPanelTab = 'chat' | 'questions';

export const WIDGET_CARD_WIDTH = 220;
export const WIDGET_CARD_MIN_HEIGHT = 60;
export const WIDGET_MINI_SIZE = 36;
export const WIDGET_CARD_RADIUS = 16;
export const CHAT_MESSAGES_MAX_HEIGHT = 180;
export const WIDGET_BRAND_PILL_SIZE = 24;
export const WIDGET_TITLE = 'Assistant ProDay';

export function formatChatTime(date = new Date()): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function executePoleHelpNavigate(
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

export function PoleHelpIcon({
  usesBriefcaseIcon,
  size = 16,
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

export const ChatMessage: React.FC<{
  msg: ChatBubble;
  index: number;
  colors: AppColors;
  styles: ReturnType<typeof createChatStyles>;
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
          <PoleHelpIcon usesBriefcaseIcon={usesBriefcaseIcon} size={10} color={colors.brand} />
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

export const CategoryAccordion: React.FC<{
  category: PoleHelpCategory;
  label: string;
  entries: PoleHelpEntry[];
  open: boolean;
  query: string;
  colors: AppColors;
  styles: ReturnType<typeof createPanelStyles>;
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

export function toggleCategoryWithAnimation(
  category: PoleHelpCategory,
  setOpenCategories: React.Dispatch<React.SetStateAction<Set<PoleHelpCategory>>>,
): void {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setOpenCategories((prev) => {
    const next = new Set(prev);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    return next;
  });
}

export function isOtherQuestionVisible(query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    POLE_HELP_OTHER_QUESTION.question.toLowerCase().includes(q) ||
    POLE_HELP_OTHER_QUESTION.answer.toLowerCase().includes(q)
  );
}

export function createChatStyles(c: AppColors) {
  return StyleSheet.create({
    bubbleRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    bubbleRowBot: { justifyContent: 'flex-start' },
    bubbleRowUser: { justifyContent: 'flex-end' },
    botAvatar: {
      width: 20,
      height: 20,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    bubbleColumn: { maxWidth: '88%', gap: 3 },
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
    bubbleText: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
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
  });
}

export function createPanelStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      gap: spacing.md,
    },
    headerCopy: { flex: 1, gap: 2 },
    headerTitle: { fontWeight: '800', fontSize: 16, letterSpacing: -0.2 },
    headerSubtitle: { fontWeight: '600', fontSize: 11 },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    segmentTrack: {
      flexDirection: 'row',
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
      padding: 3,
      borderRadius: radius.pill,
      borderWidth: 1,
      gap: 3,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
    },
    segmentLabel: { fontWeight: '700', fontSize: 13 },
    tabBody: { flex: 1, minHeight: 0 },
    chatTab: { flex: 1, gap: spacing.sm },
    messages: { flexGrow: 0 },
    messagesContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    inlineSuggestions: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    inlineSuggestionsLabel: {
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      fontSize: 10,
    },
    suggestionsRow: { gap: spacing.sm, paddingRight: spacing.lg },
    quickChip: {
      maxWidth: 200,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    quickChipText: { fontWeight: '700', fontSize: 11 },
    questionsTab: { flex: 1, minHeight: 0 },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
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
    accordionScroll: { flex: 1 },
    accordionContent: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      paddingBottom: spacing.sm,
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
    footer: {
      alignItems: 'center',
      paddingTop: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    footerText: { fontSize: 11, fontWeight: '600' },
  });
}
