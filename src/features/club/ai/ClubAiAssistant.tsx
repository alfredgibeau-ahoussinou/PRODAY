import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { useClubShellNav } from '../shell/ClubShellNavContext';
import { useClubTheme } from '../shell/ClubThemeContext';
import { useClubWorkspace } from '../hooks/useClubWorkspace';
import { ClubText } from '../ui/clubUi';
import { planClubAiReply } from './clubAiExecutor';
import {
  sendClubAssistantMessage,
  type ClubAssistantChatMessage,
  type ClubAssistantContext,
} from '../../../services/clubAssistant.service';
import { teamEventsService } from '../../../services/teamEvents.service';
import { isCoachTrainingEvent } from '../../../models/TeamEvent';
import { stripDashTypography } from '../../../utils/stripDashTypography';
import { formatClubAiCloudFailure } from '../../../utils/aiUxHonesty';
import { PLAYER_DARK, PLAYER_DARK_RADIUS } from '../../../theme/playerDarkPremium';
import { spacing } from '../../../theme/designTokens';
import { clubRadius, clubShadow, clubSpace } from '../theme/clubDesignSystem';
import type { ClubThemeTokens } from '../theme/clubTokens';

type Msg = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  model?: string;
  timestamp?: string;
};

type PromptCategory = 'all' | 'strat' | 'roster' | 'admin' | 'staff';

interface QuickPrompt {
  id: string;
  category: PromptCategory;
  label: string;
  icon: IconName;
  text: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'briefing',
    category: 'strat',
    label: 'Briefing exécutif',
    icon: 'stats-chart',
    text: 'Donne-moi le briefing complet du club aujourd’hui avec les priorités immédiates.',
  },
  {
    id: 'balance',
    category: 'roster',
    label: 'Équilibrer effectifs',
    icon: 'people',
    text: 'Comment équilibrer au mieux les effectifs et temps de jeu entre nos équipes ?',
  },
  {
    id: 'reminders',
    category: 'roster',
    label: 'Rappels convocations',
    icon: 'time',
    text: 'Quels rappels de convocation dois-je envoyer pour les prochains matchs et entraînements ?',
  },
  {
    id: 'licenses',
    category: 'admin',
    label: 'Audit licences FFF',
    icon: 'document',
    text: 'Quel est l’état de conformité des licences, certificats et adhésions en attente ?',
  },
  {
    id: 'staff',
    category: 'staff',
    label: 'Affectation coachs',
    icon: 'school',
    text: 'Aide-moi à affecter un éducateur sur les créneaux vacants et optimiser les présences staff.',
  },
  {
    id: 'weekend',
    category: 'strat',
    label: 'Prépa week-end match',
    icon: 'trophy',
    text: 'Fais-moi un plan d’action pour les matchs de ce week-end : logistique, convocations et vestiaires.',
  },
];

const EXECUTIVE_ACTIONS: {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
  query: string;
  color: string;
}[] = [
  {
    id: 'briefing',
    title: 'Briefing du jour',
    subtitle: 'Point complet 1-clic',
    icon: 'stats-chart',
    query: 'Donne-moi le briefing exécutif complet du club pour aujourd’hui.',
    color: '#3B82F6',
  },
  {
    id: 'notifs',
    title: 'Centre d’alertes',
    subtitle: 'Voir les urgences',
    icon: 'notifications',
    query: 'Montre les notifications et alertes prioritaires du club (licences, absences, retards).',
    color: '#EF4444',
  },
  {
    id: 'reminders',
    title: 'Rappels convocations',
    subtitle: 'Relance des joueurs',
    icon: 'time',
    query: 'Envoie les rappels de convocation aux joueurs en attente de réponse.',
    color: '#10B981',
  },
  {
    id: 'staff',
    title: 'Affectation staff',
    subtitle: 'Organiser les coachs',
    icon: 'school',
    query: 'Aide-moi à organiser et affecter le staff technique sur les différentes équipes.',
    color: '#8B5CF6',
  },
];

const WELCOME_INITIAL =
  'Bonjour ! Je suis votre Copilote IA Dirigeant ProDay, propulsé par Google Gemini.\n\nJe vous assiste dans la gouvernance et le pilotage quotidien de votre club : analyse prédictive des effectifs, planification stratégique des matchs et entraînements, convocations automatisées et conformité des licences FFF.\n\nComment puis-je vous aider aujourd’hui ?';

/**
 * Copilote IA Club — Studio Obsidian Glass moderne.
 * Dialogue propulsé par Google Gemini avec gouvernance souveraine du dirigeant.
 */
export function ClubAiAssistant({ embedded = false }: { embedded?: boolean } = {}) {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCat, setSelectedCat] = useState<PromptCategory>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: '0',
      role: 'assistant',
      text: WELCOME_INITIAL,
      model: 'Google Gemini Flash Lite',
    },
  ]);
  const scrollRef = useRef<ScrollView>(null);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const clubDisplayName = ws.club?.name || (ws.clubId ? `Club ${ws.clubId.slice(0, 6)}` : 'Votre Club');
  const pendingMemberships = ws.pendingMemberships ?? ws.memberships.filter((m) => m.status === 'pending').length;

  const filteredPrompts = useMemo(() => {
    if (selectedCat === 'all') return QUICK_PROMPTS;
    return QUICK_PROMPTS.filter((p) => p.category === selectedCat);
  }, [selectedCat]);

  const runSensitive = (id: string) => {
    if (id === 'propose_assign_coach' || id === 'refuse_auto_move') {
      shellNav?.requestNav(id === 'refuse_auto_move' ? 'players' : 'coaches');
      return;
    }
    if (id === 'nav_trainings') {
      shellNav?.requestNav('trainings');
      return;
    }
    if (id === 'propose_send_reminders') {
      const target =
        ws.todayTrainings[0] ??
        ws.events.find((e) => isCoachTrainingEvent(e));
      if (!target) {
        Alert.alert('Rappels', 'Aucune séance trouvée.');
        return;
      }
      void (async () => {
        try {
          const pending = await teamEventsService.sendReminders(target.id);
          Alert.alert(
            'Rappels envoyés',
            pending > 0
              ? `${pending} joueur(s) encore en attente ont été relancés.`
              : 'Aucun rappel en attente pour cette séance.',
          );
        } catch (e) {
          Alert.alert(
            'Rappels',
            e instanceof Error
              ? e.message
              : 'Envoi distant indisponible — ouvrez la séance pour relancer manuellement.',
          );
          shellNav?.requestNav('trainings');
        }
      })();
    }
  };

  const maybeConfirmSensitive = (text: string) => {
    const plan = planClubAiReply(text, ws);
    if (plan.safeNav && !plan.sensitive) {
      shellNav?.requestNav(plan.safeNav);
    }
    if (plan.sensitive) {
      const s = plan.sensitive;
      Alert.alert(s.title, s.body, [
        { text: 'Annuler', style: 'cancel' },
        { text: s.confirmLabel, onPress: () => runSensitive(s.id) },
      ]);
    }
    return plan;
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    const localPlan = maybeConfirmSensitive(trimmed);

    try {
      const history: ClubAssistantChatMessage[] = next
        .filter((m) => m.id !== '0')
        .map((m) => ({ role: m.role, content: m.text }));

      const context: ClubAssistantContext = {
        clubId: ws.club?.id,
        clubName: clubDisplayName,
        teamCount: ws.teams.length,
        playerCount: ws.players.length,
        coachCount: ws.coaches.length,
        pendingMemberships,
        eventsCount: ws.events.length,
      };

      const res = await sendClubAssistantMessage(
        history.length > 0 ? history : [{ role: 'user', content: trimmed }],
        context,
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: stripDashTypography(res.reply),
          model: res.model?.includes('gemini') ? 'Google Gemini Flash Lite' : res.model,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e) {
      const errMsg =
        e instanceof Error && e.message.trim()
          ? e.message.trim()
          : 'Erreur réseau ou copilote indisponible.';
      const localGuide =
        localPlan.reply &&
        !localPlan.reply.startsWith('Je recommande, je ne décide pas')
          ? stripDashTypography(localPlan.reply)
          : null;
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: formatClubAiCloudFailure({
            errorMessage: errMsg,
            localGuide,
          }),
          model: 'Google Gemini (Mode Secours)',
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    Clipboard.setString(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const onResetChat = () => {
    Alert.alert('Nouvelle session', 'Réinitialiser la conversation avec le Copilote Gemini ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Réinitialiser',
        style: 'destructive',
        onPress: () => {
          setMessages([
            {
              id: '0',
              role: 'assistant',
              text: WELCOME_INITIAL,
              model: 'Google Gemini Flash Lite',
            },
          ]);
          setInput('');
        },
      },
    ]);
  };

  const hasThread = messages.length > 1;

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {/* Header moderne Gemini Club */}
        {!embedded ? (
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={styles.geminiOrbContainer}>
                <View style={styles.geminiOrbGlow} />
                <View style={styles.geminiOrbCore}>
                  <Icon name="sparkles" size={20} color="#38BDF8" />
                </View>
                <View style={styles.activePulseDot} />
              </View>

              <View style={styles.headerTexts}>
                <View style={styles.titleRow}>
                  <ClubText variant="title" style={styles.headerTitle}>
                    Copilote Club
                  </ClubText>
                  <View style={styles.geminiBadge}>
                    <Icon name="sparkles" size={10} color="#38BDF8" />
                    <ClubText style={styles.geminiBadgeText}>GEMINI FLASH LITE</ClubText>
                  </View>
                </View>
                <ClubText variant="caption" muted numberOfLines={1}>
                  Intelligence décisionnelle · validation souveraine dirigeant
                </ClubText>
              </View>
            </View>

            {hasThread ? (
              <PressableSpring
                onPress={onResetChat}
                style={styles.headerActionBtn}
                scaleTo={0.92}
                haptic
                accessibilityLabel="Réinitialiser la conversation"
              >
                <Icon name="refresh" size={16} color={tokens.muted} />
              </PressableSpring>
            ) : null}
          </View>
        ) : null}

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Card Exécutif Gemini */}
          {!hasThread ? (
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View style={styles.heroPill}>
                  <Icon name="shield" size={13} color="#38BDF8" />
                  <ClubText style={styles.heroPillText}>ASSISTANT DIRIGEANT & STAFF</ClubText>
                </View>

                <View style={styles.geminiStatusBadge}>
                  <View style={styles.geminiStatusDot} />
                  <ClubText style={styles.geminiStatusText}>GOOGLE GEMINI ACTIF</ClubText>
                </View>
              </View>

              <ClubText variant="body" style={styles.heroBody}>
                Bonjour ! Je suis votre Copilote IA Dirigeant ProDay, propulsé par{' '}
                <ClubText style={styles.heroBoldGemini}>Google Gemini</ClubText>.
                {'\n\n'}
                Je vous assiste dans la gouvernance de{' '}
                <ClubText style={styles.heroBoldClub}>{clubDisplayName}</ClubText> : audit des
                effectifs, calendrier des rencontres, relances des convocations et conformité FFF.
              </ClubText>

              {/* Stat Dock interactif (tap pour naviguer) */}
              <View style={styles.metricsRow}>
                <PressableSpring
                  onPress={() => shellNav?.requestNav('teams')}
                  style={styles.metricCard}
                  scaleTo={0.96}
                  haptic
                >
                  <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <Icon name="football" size={13} color="#60A5FA" />
                  </View>
                  <View>
                    <ClubText style={styles.metricValue}>
                      {ws.teams.length > 0 ? ws.teams.length : '—'}
                    </ClubText>
                    <ClubText style={styles.metricLabel}>Équipes</ClubText>
                  </View>
                  <Icon name="chevron-forward" size={12} color={tokens.faint} />
                </PressableSpring>

                <PressableSpring
                  onPress={() => shellNav?.requestNav('players')}
                  style={styles.metricCard}
                  scaleTo={0.96}
                  haptic
                >
                  <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Icon name="people" size={13} color="#34D399" />
                  </View>
                  <View>
                    <ClubText style={styles.metricValue}>
                      {ws.players.length > 0 ? ws.players.length : '—'}
                    </ClubText>
                    <ClubText style={styles.metricLabel}>Licenciés</ClubText>
                  </View>
                  <Icon name="chevron-forward" size={12} color={tokens.faint} />
                </PressableSpring>

                <PressableSpring
                  onPress={() => shellNav?.requestNav('coaches')}
                  style={styles.metricCard}
                  scaleTo={0.96}
                  haptic
                >
                  <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                    <Icon name="school" size={13} color="#A78BFA" />
                  </View>
                  <View>
                    <ClubText style={styles.metricValue}>
                      {ws.coaches.length > 0 ? ws.coaches.length : '—'}
                    </ClubText>
                    <ClubText style={styles.metricLabel}>Staff</ClubText>
                  </View>
                  <Icon name="chevron-forward" size={12} color={tokens.faint} />
                </PressableSpring>
              </View>

              {/* Executive Alert Banner si besoin */}
              {pendingMemberships > 0 ? (
                <View style={styles.insightBanner}>
                  <Icon name="alert-circle" size={15} color="#FBBF24" />
                  <ClubText style={styles.insightBannerText}>
                    {pendingMemberships} adhésion(s) ou licence(s) en attente d’arbitrage.
                  </ClubText>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Catégories de questions & Prompts rapides */}
          {!hasThread ? (
            <View style={styles.promptsSection}>
              <View style={styles.sectionHeaderRow}>
                <ClubText variant="label" muted style={styles.sectionTitle}>
                  QUESTIONS STRATÉGIQUES
                </ClubText>

                {/* Filtres de catégorie */}
                <View style={styles.categoryPillsRow}>
                  {(
                    [
                      { id: 'all', label: 'Tous' },
                      { id: 'strat', label: 'Stratégie' },
                      { id: 'roster', label: 'Effectifs' },
                      { id: 'admin', label: 'Licences' },
                      { id: 'staff', label: 'Staff' },
                    ] as const
                  ).map((cat) => {
                    const isSelected = selectedCat === cat.id;
                    return (
                      <PressableSpring
                        key={cat.id}
                        onPress={() => setSelectedCat(cat.id)}
                        style={[
                          styles.catFilterPill,
                          isSelected && {
                            backgroundColor: 'rgba(56, 189, 248, 0.16)',
                            borderColor: '#38BDF8',
                          },
                        ]}
                        scaleTo={0.95}
                        haptic
                      >
                        <ClubText
                          style={[
                            styles.catFilterText,
                            isSelected && { color: '#38BDF8', fontWeight: '800' },
                          ]}
                        >
                          {cat.label}
                        </ClubText>
                      </PressableSpring>
                    );
                  })}
                </View>
              </View>

              {/* Grille fluide de questions rapides */}
              <View style={styles.promptsGrid}>
                {filteredPrompts.map((p) => (
                  <PressableSpring
                    key={p.id}
                    onPress={() => void send(p.text)}
                    style={styles.promptCard}
                    scaleTo={0.97}
                    haptic
                  >
                    <View style={styles.promptCardIcon}>
                      <Icon name={p.icon} size={15} color="#38BDF8" />
                    </View>
                    <ClubText style={styles.promptCardText}>{p.label}</ClubText>
                    <Icon name="chevron-forward" size={13} color={tokens.muted} />
                  </PressableSpring>
                ))}
              </View>
            </View>
          ) : null}

          {/* Grille d'actions exécutives 2x2 */}
          {!hasThread ? (
            <View style={styles.actionsSection}>
              <ClubText variant="label" muted style={styles.sectionTitle}>
                ACTIONS RAPIDES DIRIGEANT
              </ClubText>
              <View style={styles.actionGrid}>
                {EXECUTIVE_ACTIONS.map((action) => (
                  <PressableSpring
                    key={action.id}
                    onPress={() => void send(action.query)}
                    style={styles.actionGridCard}
                    scaleTo={0.97}
                    haptic
                  >
                    <View style={styles.actionCardTop}>
                      <View
                        style={[
                          styles.actionIconWrap,
                          { backgroundColor: `${action.color}22` },
                        ]}
                      >
                        <Icon name={action.icon} size={17} color={action.color} />
                      </View>
                      <Icon name="chevron-forward" size={14} color={tokens.faint} />
                    </View>
                    <ClubText variant="caption" style={styles.actionCardTitle} numberOfLines={1}>
                      {action.title}
                    </ClubText>
                    <ClubText
                      variant="caption"
                      muted
                      style={styles.actionCardSubtitle}
                      numberOfLines={1}
                    >
                      {action.subtitle}
                    </ClubText>
                  </PressableSpring>
                ))}
              </View>
            </View>
          ) : null}

          {/* Fil de discussion actif */}
          {hasThread ? (
            <View style={styles.thread}>
              {messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.messageBubble,
                      isUser
                        ? [styles.userBubble, { backgroundColor: 'rgba(56, 189, 248, 0.18)' }]
                        : styles.assistantBubble,
                    ]}
                  >
                    {!isUser ? (
                      <View style={styles.assistantHeader}>
                        <View style={styles.assistantBadge}>
                          <View style={styles.geminiTinySparkle}>
                            <Icon name="sparkles" size={11} color="#38BDF8" />
                          </View>
                          <ClubText style={styles.assistantName}>Copilote Gemini</ClubText>
                          <View style={styles.assistantModelPill}>
                            <ClubText style={styles.assistantModelPillText}>
                              {m.model || 'Gemini Flash Lite'}
                            </ClubText>
                          </View>
                        </View>

                        {/* Bouton copier */}
                        <PressableSpring
                          onPress={() => copyToClipboard(m.text, m.id)}
                          scaleTo={0.9}
                          haptic
                          style={styles.copyBtn}
                        >
                          <Icon
                            name={copiedId === m.id ? 'checkmark-circle' : 'document-text'}
                            size={12}
                            color={copiedId === m.id ? '#10B981' : tokens.muted}
                          />
                          <ClubText style={styles.copyBtnText}>
                            {copiedId === m.id ? 'Copié' : 'Copier'}
                          </ClubText>
                        </PressableSpring>
                      </View>
                    ) : null}

                    <ClubText
                      variant="body"
                      style={[
                        styles.messageText,
                        isUser && { color: '#F0F9FF', fontWeight: '500' },
                      ]}
                    >
                      {m.text.replace(/(^|\n)\s*[-*]\s/g, '$1• ')}
                    </ClubText>
                  </View>
                );
              })}

              {/* Indicateur de réflexion Gemini */}
              {loading ? (
                <View style={styles.thinkingBubble}>
                  <View style={styles.thinkingIndicatorWrap}>
                    <ActivityIndicator color="#38BDF8" size="small" />
                  </View>
                  <View>
                    <ClubText style={styles.thinkingTitle}>Google Gemini réfléchit…</ClubText>
                    <ClubText variant="caption" style={styles.thinkingText}>
                      Analyse des données et synthèse stratégique du club
                    </ClubText>
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        {/* Floating Glass Composer */}
        <View style={styles.composerWrap}>
          <View style={styles.composerCard}>
            <View style={styles.composerSparkle}>
              <Icon name="sparkles" size={17} color="#38BDF8" />
            </View>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Demandez une analyse, un briefing, un conseil…"
              placeholderTextColor="rgba(148, 163, 184, 0.7)"
              style={[styles.input, { color: tokens.foreground }]}
              editable={!loading}
              multiline
              maxLength={1200}
              onSubmitEditing={() => void send(input)}
              blurOnSubmit={false}
            />
            <PressableSpring
              onPress={() => void send(input)}
              scaleTo={0.92}
              haptic
              disabled={loading || !input.trim()}
              style={[
                styles.sendBtn,
                {
                  backgroundColor:
                    input.trim() && !loading ? '#38BDF8' : 'rgba(255, 255, 255, 0.08)',
                },
              ]}
              accessibilityLabel="Envoyer à Gemini"
            >
              <Icon
                name="chevron-forward"
                size={18}
                color={input.trim() && !loading ? '#04101E' : 'rgba(148, 163, 184, 0.6)'}
              />
            </PressableSpring>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    flex: { flex: 1, minHeight: 0 },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(6, 11, 20, 0.7)',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
      minWidth: 0,
    },
    geminiOrbContainer: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    geminiOrbGlow: {
      position: 'absolute',
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: 'rgba(56, 189, 248, 0.25)',
      transform: [{ scale: 1.15 }],
    },
    geminiOrbCore: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderWidth: 1.5,
      borderColor: 'rgba(56, 189, 248, 0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    activePulseDot: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: '#10B981',
      borderWidth: 2,
      borderColor: '#060B14',
    },
    headerTexts: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: 0.1,
      color: '#FFFFFF',
    },
    geminiBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.4)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    geminiBadgeText: {
      fontSize: 8.5,
      fontWeight: '800',
      letterSpacing: 0.5,
      color: '#38BDF8',
    },
    headerActionBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    heroCard: {
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      borderRadius: clubRadius.lg,
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.25)',
      padding: spacing.md,
      gap: spacing.md,
      ...clubShadow.card,
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    heroPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: 6,
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.3)',
    },
    heroPillText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.5,
      color: '#38BDF8',
    },
    geminiStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    geminiStatusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#10B981',
    },
    geminiStatusText: {
      fontSize: 8.5,
      fontWeight: '800',
      letterSpacing: 0.4,
      color: '#34D399',
    },
    heroBody: {
      fontSize: 14,
      lineHeight: 22,
      color: '#CBD5E1',
    },
    heroBoldGemini: {
      color: '#38BDF8',
      fontWeight: '700',
    },
    heroBoldClub: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    metricsRow: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    metricCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    metricIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
    },
    metricValue: {
      fontSize: 13,
      fontWeight: '800',
      color: '#FFFFFF',
      lineHeight: 16,
    },
    metricLabel: {
      fontSize: 9.5,
      fontWeight: '600',
      color: 'rgba(148, 163, 184, 0.8)',
    },
    insightBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.25)',
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 8,
    },
    insightBannerText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: '#FCD34D',
      flex: 1,
    },
    promptsSection: {
      gap: spacing.sm,
    },
    sectionHeaderRow: {
      gap: 6,
    },
    sectionTitle: {
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
      color: 'rgba(148, 163, 184, 0.8)',
    },
    categoryPillsRow: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
    },
    catFilterPill: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 14,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    catFilterText: {
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(203, 213, 225, 0.8)',
    },
    promptsGrid: {
      gap: 6,
    },
    promptCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    promptCardIcon: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    promptCardText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: '#F1F5F9',
    },
    actionsSection: {
      gap: spacing.xs,
    },
    actionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    actionGridCard: {
      flex: 1,
      minWidth: '47%',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 14,
      padding: spacing.sm,
      gap: 4,
    },
    actionCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 3,
    },
    actionIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionCardTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    actionCardSubtitle: {
      fontSize: 11,
      color: 'rgba(148, 163, 184, 0.8)',
    },
    thread: {
      gap: spacing.md,
    },
    messageBubble: {
      padding: spacing.md,
      borderRadius: 16,
      maxWidth: '88%',
    },
    userBubble: {
      alignSelf: 'flex-end',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.4)',
      borderBottomRightRadius: 4,
    },
    assistantBubble: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.25)',
      borderBottomLeftRadius: 4,
      gap: 8,
      maxWidth: '92%',
      ...clubShadow.card,
    },
    assistantHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255, 255, 255, 0.08)',
      paddingBottom: 6,
    },
    assistantBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    geminiTinySparkle: {
      width: 18,
      height: 18,
      borderRadius: 6,
      backgroundColor: 'rgba(56, 189, 248, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    assistantName: {
      fontSize: 11,
      fontWeight: '800',
      color: '#38BDF8',
      letterSpacing: 0.3,
    },
    assistantModelPill: {
      backgroundColor: 'rgba(255, 255, 255, 0.07)',
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 4,
    },
    assistantModelPillText: {
      fontSize: 8.5,
      fontWeight: '700',
      color: 'rgba(148, 163, 184, 0.9)',
    },
    copyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    copyBtnText: {
      fontSize: 9.5,
      fontWeight: '600',
      color: 'rgba(148, 163, 184, 0.8)',
    },
    messageText: {
      fontSize: 14,
      lineHeight: 22,
      color: '#F1F5F9',
    },
    thinkingBubble: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.3)',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 14,
      alignSelf: 'flex-start',
    },
    thinkingIndicatorWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    thinkingTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: '#38BDF8',
    },
    thinkingText: {
      fontSize: 11,
      color: 'rgba(148, 163, 184, 0.8)',
    },
    composerWrap: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
      backgroundColor: 'transparent',
    },
    composerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.3)',
      borderRadius: 26,
      paddingHorizontal: 10,
      paddingVertical: 7,
      gap: 8,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOpacity: 0.4,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        },
        android: { elevation: 8 },
        default: {},
      }),
    },
    composerSparkle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      flex: 1,
      fontSize: 14,
      maxHeight: 90,
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    sendBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
