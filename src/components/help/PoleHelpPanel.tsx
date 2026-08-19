import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { AnimatedEntrance, PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import {
  getPoleHelpQuickSuggestions,
  groupPoleHelpEntriesByCategory,
  POLE_HELP_OTHER_QUESTION,
  type PoleHelpCategory,
  type PoleHelpContent,
  type PoleHelpEntry,
} from '../../content/poleHelpContent';
import { brandOverlay } from '../../theme/designTokens';
import {
  CategoryAccordion,
  ChatMessage,
  CHAT_MESSAGES_MAX_HEIGHT,
  createChatStyles,
  createPanelStyles,
  executePoleHelpNavigate,
  formatChatTime,
  isOtherQuestionVisible,
  toggleCategoryWithAnimation,
  type ChatBubble,
  type PoleHelpPanelTab,
} from './poleHelpChatShared';

type PoleHelpPanelProps = {
  visible: boolean;
  content: PoleHelpContent;
  questionCount: number;
  usesBriefcaseIcon: boolean;
  onClose: () => void;
};

export const PoleHelpPanel: React.FC<PoleHelpPanelProps> = ({
  visible,
  content,
  questionCount,
  usesBriefcaseIcon,
  onClose,
}) => {
  const { colors: appColors } = useAppTheme();
  const profile = useSessionProfile();
  const playerColors = usePlayerThemeColors();
  const colors = useMemo(
    () =>
      profile?.role === 'player'
        ? {
            ...appColors,
            brand: playerColors.accent,
            brandSoft: playerColors.accentSoft,
            accent: playerColors.accent,
            accentSoft: playerColors.accentSoft,
          }
        : appColors,
    [appColors, playerColors.accent, playerColors.accentSoft, profile?.role],
  );
  const insets = useSafeAreaInsets();
  const nav = useTabNavigationActions();
  const panelStyles = useMemo(() => createPanelStyles(colors), [colors]);
  const chatStyles = useMemo(() => createChatStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState<PoleHelpPanelTab>('chat');
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [query, setQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<PoleHelpCategory>>(
    () => new Set(['navigation']),
  );
  const scrollRef = useRef<ScrollView>(null);

  const categoryGroups = useMemo(() => groupPoleHelpEntriesByCategory(content), [content]);
  const quickSuggestions = useMemo(() => getPoleHelpQuickSuggestions(content), [content]);
  const filteredOtherVisible = isOtherQuestionVisible(query);

  const resetConversation = useCallback(() => {
    setQuery('');
    setActiveTab('chat');
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
    if (visible) resetConversation();
  }, [visible, resetConversation]);

  useEffect(() => {
    if (!visible || activeTab !== 'chat') return;
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [messages, visible, activeTab]);

  const handleSuggestion = useCallback((entry: PoleHelpEntry) => {
    const time = formatChatTime();
    setActiveTab('chat');
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
      onClose();
    },
    [nav, onClose],
  );

  const toggleCategory = useCallback((category: PoleHelpCategory) => {
    toggleCategoryWithAnimation(category, setOpenCategories);
  }, []);

  return (
    <AnimatedModalShell
      visible={visible}
      onClose={onClose}
      variant="compact"
      handleOnly
    >
      <View style={[panelStyles.root, { backgroundColor: colors.background }]}>
        <View style={[panelStyles.header, { borderBottomColor: colors.border }]}>
          <View style={panelStyles.headerCopy}>
            <ProDayText variant="section" style={panelStyles.headerTitle}>
              {content.title}
            </ProDayText>
            <ProDayText variant="caption" muted style={panelStyles.headerSubtitle}>
              {questionCount} questions · réponses instantanées
            </ProDayText>
          </View>
          <PressableSpring
            onPress={onClose}
            scaleTo={0.92}
            haptic
            style={[panelStyles.closeBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel="Fermer l’assistant"
          >
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </PressableSpring>
        </View>

        <View
          style={[
            panelStyles.segmentTrack,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {(['chat', 'questions'] as const).map((tab) => {
            const selected = activeTab === tab;
            return (
              <PressableSpring
                key={tab}
                onPress={() => setActiveTab(tab)}
                scaleTo={0.98}
                haptic
                style={[
                  panelStyles.segment,
                  selected && {
                    backgroundColor: colors.brand,
                  },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
              >
                <ProDayText
                  variant="caption"
                  style={[
                    panelStyles.segmentLabel,
                    { color: selected ? colors.brandInverse : colors.textMuted },
                  ]}
                >
                  {tab === 'chat' ? 'Chat' : 'Questions'}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>

        {activeTab === 'chat' ? (
          <View style={panelStyles.chatTab}>
            <ScrollView
              ref={scrollRef}
              style={[panelStyles.messages, { maxHeight: CHAT_MESSAGES_MAX_HEIGHT }]}
              contentContainerStyle={panelStyles.messagesContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {messages.map((msg, index) => (
                <ChatMessage
                  key={msg.id}
                  msg={msg}
                  index={index}
                  colors={colors}
                  styles={chatStyles}
                  usesBriefcaseIcon={usesBriefcaseIcon}
                  onNavigate={handleNavigate}
                />
              ))}
            </ScrollView>

            {messages.length <= 1 ? (
              <AnimatedEntrance kind="fadeUp" index={1}>
                <View style={panelStyles.inlineSuggestions}>
                  <ProDayText variant="caption" muted style={panelStyles.inlineSuggestionsLabel}>
                    Suggestions rapides
                  </ProDayText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={panelStyles.suggestionsRow}
                  >
                    {quickSuggestions.map((entry) => (
                      <PressableSpring
                        key={entry.id}
                        style={[
                          panelStyles.quickChip,
                          { borderColor: brandOverlay(0.25), backgroundColor: colors.brandSoft },
                        ]}
                        onPress={() => handleSuggestion(entry)}
                        scaleTo={0.96}
                        haptic
                      >
                        <ProDayText
                          variant="caption"
                          style={[panelStyles.quickChipText, { color: colors.brand }]}
                        >
                          {entry.question}
                        </ProDayText>
                      </PressableSpring>
                    ))}
                  </ScrollView>
                </View>
              </AnimatedEntrance>
            ) : null}
          </View>
        ) : (
          <View style={panelStyles.questionsTab}>
            <View
              style={[
                panelStyles.searchWrap,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Icon name="search" size={14} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Rechercher une question…"
                placeholderTextColor={colors.textMuted}
                style={[panelStyles.searchInput, { color: colors.text }]}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>

            <ScrollView
              style={panelStyles.accordionScroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              contentContainerStyle={panelStyles.accordionContent}
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
                  styles={panelStyles}
                  onToggle={() => toggleCategory(group.category)}
                  onSelect={handleSuggestion}
                />
              ))}

              {filteredOtherVisible ? (
                <PressableSpring
                  style={[
                    panelStyles.otherQuestion,
                    { borderColor: colors.brand, backgroundColor: brandOverlay(0.08) },
                  ]}
                  onPress={() => handleSuggestion(POLE_HELP_OTHER_QUESTION)}
                  scaleTo={0.98}
                  haptic
                >
                  <Icon name="mail" size={16} color={colors.brand} />
                  <View style={panelStyles.otherQuestionCopy}>
                    <ProDayText
                      variant="caption"
                      style={[panelStyles.otherQuestionTitle, { color: colors.brand }]}
                    >
                      {POLE_HELP_OTHER_QUESTION.question}
                    </ProDayText>
                    <ProDayText variant="caption" muted style={panelStyles.otherQuestionHint}>
                      Contacter proday.admin@gmail.com
                    </ProDayText>
                  </View>
                  <Icon name="chevron-forward" size={14} color={colors.brand} />
                </PressableSpring>
              ) : null}
            </ScrollView>
          </View>
        )}

        <View
          style={[
            panelStyles.footer,
            {
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 8),
            },
          ]}
        >
          <ProDayText variant="caption" muted style={panelStyles.footerText}>
            Besoin d’aide ? proday.admin@gmail.com
          </ProDayText>
        </View>
      </View>
    </AnimatedModalShell>
  );
};
