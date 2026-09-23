import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PressableSpring } from '../motion';
import { useAuth } from '../../context/AuthContext';
import {
  sendPlayerCoachMessage,
  type PlayerAiAction,
  type PlayerCoachAiMessage,
} from '../../services/playerCoachAi.service';
import { stripDashTypography } from '../../utils/stripDashTypography';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { CLUB_TOKENS } from '../../features/club/theme/clubTokens';
import { PRODAY_POLE_ACCENTS } from '../../theme/prodayBrand';
import { joueurGamePress } from '../../features/joueur/joueurSfx';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { isHomeTrainingIntent, type PlayerNavigateTab } from '../../utils/playerCoachIntent';
import { usePlayerTheme } from '../../context/PlayerThemeContext';
import {
  playerColors,
  playerType,
  playerForm,
  playerCard,
  PLAYER_SURFACE_TOKENS,
} from '../../theme/playerDesignSystem';

type Bubble = PlayerCoachAiMessage & { id: string; timestamp?: string };

type PromptSuggestion = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  tag: string;
  title: string;
  subtitle: string;
  prompt: string;
};

export const POST_SESSION_DRILLS = [
  {
    id: 'drill-1',
    icon: 'flash-outline' as const,
    accent: CLUB_TOKENS.success,
    title: 'Appuis & Vivacité',
    duration: '15 min',
    focus: 'Explosivité & Changements',
    prompt: 'Détaille-moi le protocole complet de l’exercice post-séance Appuis Courts & Vivacité (15 min) adapté à mon poste.',
  },
  {
    id: 'drill-2',
    icon: 'football-outline' as const,
    accent: playerColors.accentAlt,
    title: 'Finition 1-Touch',
    duration: '20 min',
    focus: 'Précision & Cadrage rapide',
    prompt: 'Détaille-moi le protocole complet de l’exercice post-séance Finition 1-Touch & Cadrage (20 min) adapté à mon poste.',
  },
  {
    id: 'drill-3',
    icon: 'shield-checkmark-outline' as const,
    accent: CLUB_TOKENS.secondary,
    title: 'Gainage & Ischios',
    duration: '10 min',
    focus: 'Prévention & Mobilité',
    prompt: 'Détaille-moi le protocole complet de l’exercice post-séance Gainage & Prévention Ischios (10 min).',
  },
];

export const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  {
    id: 'post_session',
    icon: 'flame-outline',
    tag: 'RÉCUPÉRATION',
    title: 'Recommandations post-séance',
    subtitle: 'Exercices personnalisés suite à ta dernière séance / match',
    prompt: 'Analyse mes dernières séances et recommande-moi 3 exercices personnalisés post-séance adaptés à mon profil et mon poste.',
  },
  {
    id: 'tactics',
    icon: 'compass-outline',
    tag: 'TACTIQUE',
    title: 'Plan de match & Déplacements',
    subtitle: 'Placement entre les lignes, appels et orientation',
    prompt: 'Donne-moi les consignes tactiques et déplacements clés pour exceller à mon poste.',
  },
  {
    id: 'drills',
    icon: 'flash-outline',
    tag: 'SÉANCE',
    title: 'Créer une séance 20 min',
    subtitle: 'Drill technique et explosivité sans matériel',
    prompt: 'Génère-moi une séance d’entraînement individuel de 20 minutes intense au ballon.',
  },
  {
    id: 'weak_foot',
    icon: 'football-outline',
    tag: 'TECHNIQUE',
    title: 'Perfectionner mon pied faible',
    subtitle: 'Prises de balle, passes et frappes cadrées',
    prompt: 'Quels sont les meilleurs exercices pour progresser rapidement sur mon mauvais pied ?',
  },
  {
    id: 'recovery',
    icon: 'battery-charging-outline',
    tag: 'FORME',
    title: 'Routine d’avant-match & Récupération',
    subtitle: 'Activation musculaire, sommeil et concentration',
    prompt: 'Quelle routine physique et mentale adopter dans les 24h avant une rencontre officielle ?',
  },
];

export const PLAYER_COACH_STARTERS = PROMPT_SUGGESTIONS;

type Props = {
  compact?: boolean;
  initialPrompt?: string;
};

export function PlayerCoachAiChat({ compact = false, initialPrompt }: Props) {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const nav = useTabNavigationActions();
  const { colors: playerTheme, clubColors } = usePlayerTheme();
  const teamColor = clubColors?.primary || playerTheme.accent || playerColors.accent;

  const firstName = profile?.display_name?.split(' ')[0] || 'Joueur';
  const position = profile?.profile?.position || 'Attaquant';
  const clubName = profile?.profile?.club_id || 'Mon équipe';

  const [messages, setMessages] = useState<Bubble[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainingCta, setTrainingCta] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const initialSentRef = useRef(false);

  const styles = useMemo(() => createStyles(teamColor), [teamColor]);
  const hasUserMessages = messages.some((m) => m.role === 'user');

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    return () => clearTimeout(t);
  }, [messages, sending]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
    joueurGamePress();
    setError(null);
    setTrainingCta(false);
    setDraft('');

    const userMsg: Bubble = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
    };
    const next = [...messages, userMsg];
    setMessages([...next]);
    setSending(true);

    try {
      const history: PlayerCoachAiMessage[] = next.map(({ role, content: c }) => ({
        role,
        content: c,
      }));
      const context = {
        playerName: profile?.display_name,
        position,
        clubName,
      };

      const result = await sendPlayerCoachMessage(history, context);
      const reply = stripDashTypography(result.reply);

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: reply,
        },
      ]);

      const trainingIntent = isHomeTrainingIntent(content);
      if (trainingIntent || isHomeTrainingIntent(reply)) {
        setTrainingCta(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion à l\'assistant IA indisponible.');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (initialPrompt && !initialSentRef.current) {
      initialSentRef.current = true;
      void send(initialPrompt);
    }
  }, [initialPrompt]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      style={[styles.root, compact && styles.compactRoot]}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.thread}
        contentContainerStyle={[styles.threadPad, !hasUserMessages && styles.emptyPad]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!hasUserMessages ? (
          /* Zéro-State : Écran d'accueil Style Apple ProDay */
          <View style={styles.welcomeContainer}>
            {/* Header épuré */}
            <View style={styles.heroHeader}>
              <View style={styles.sparkleCircle}>
                <Ionicons name="sparkles" size={24} color={playerColors.accent} />
              </View>
              <View style={styles.welcomeTextGroup}>
                <Text style={styles.greetingTitle}>Bonjour, {firstName}</Text>
                <Text style={styles.greetingSub}>Comment puis-je t'aider aujourd'hui ?</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={styles.liveDotWrap}>
                  <View style={styles.liveDot} />
                  <Text style={styles.statusText}>Conseiller disponible</Text>
                </View>
                <View style={styles.securityRow}>
                  <Ionicons name="shield-checkmark-outline" size={12} color={playerColors.textDim} />
                  <Text style={styles.securityText}>Analyse IA · Recommandations personnalisées</Text>
                </View>
              </View>
            </View>

            {/* Carte Recommandations Post-Séance (Style ProDay / Coach) */}
            <View style={[styles.postSessionCard, playerCard(PLAYER_SURFACE_TOKENS)]}>
              <View style={styles.postSessionHeaderRow}>
                <View style={styles.tagBadge}>
                  <Ionicons name="flame" size={13} color={CLUB_TOKENS.warning} />
                  <Text style={styles.tagBadgeText}>POST-SÉANCE · RECOMMANDATIONS</Text>
                </View>
                <View style={styles.surMesurePill}>
                  <Text style={styles.surMesurePillText}>SUR MESURE</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>Exercices recommandés suite à ta séance</Text>
              <Text style={styles.cardSub}>
                Ciblés selon ton profil et validés pour booster ta récupération et tes points clés.
              </Text>

              <View style={styles.drillsRow}>
                {POST_SESSION_DRILLS.map((drill) => (
                  <PressableSpring
                    key={drill.id}
                    onPress={() => send(drill.prompt)}
                    scaleTo={0.96}
                    haptic
                    style={styles.drillItemCard}
                  >
                    <View style={styles.drillHeader}>
                      <Ionicons name={drill.icon} size={15} color={drill.accent} />
                      <Text style={[styles.drillDuration, { color: drill.accent }]}>
                        {drill.duration}
                      </Text>
                    </View>
                    <Text style={styles.drillTitle} numberOfLines={1}>
                      {drill.title}
                    </Text>
                    <Text style={styles.drillFocus} numberOfLines={1}>
                      {drill.focus}
                    </Text>
                  </PressableSpring>
                ))}
              </View>
            </View>

            {/* Suggestions de Thèmes (Apple Inset Grouped) */}
            <View style={styles.suggestionsContainer}>
              <Text style={styles.sectionHeaderTitle}>THÈMES D'ACCOMPAGNEMENT</Text>
              <View style={styles.suggestionsList}>
                {PROMPT_SUGGESTIONS.map((sug) => (
                  <PressableSpring
                    key={sug.id}
                    onPress={() => send(sug.prompt)}
                    scaleTo={0.98}
                    haptic
                    style={[styles.suggestionItem, playerCard(PLAYER_SURFACE_TOKENS)]}
                  >
                    <View style={styles.suggestionIconBox}>
                      <Ionicons name={sug.icon} size={18} color={playerColors.accent} />
                    </View>
                    <View style={styles.suggestionTextCol}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.suggestionTag}>{sug.tag}</Text>
                      </View>
                      <Text style={styles.suggestionTitle}>{sug.title}</Text>
                      <Text style={styles.suggestionSub} numberOfLines={1}>
                        {sug.subtitle}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={playerColors.textMuted} />
                  </PressableSpring>
                ))}
              </View>
            </View>
          </View>
        ) : (
          /* Fil de discussion Apple Native */
          messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <View
                key={m.id}
                style={[styles.messageBlock, isUser ? styles.userBlock : styles.assistantBlock]}
              >
                {!isUser ? (
                  <View style={styles.assistantHeaderRow}>
                    <View style={styles.assistantAvatar}>
                      <Ionicons name="sparkles" size={11} color={playerColors.accent} />
                    </View>
                    <Text style={styles.assistantName}>Conseiller ProDay</Text>
                  </View>
                ) : null}

                <View
                  style={
                    isUser
                      ? styles.userBubble
                      : [styles.assistantBubble, playerCard(PLAYER_SURFACE_TOKENS)]
                  }
                >
                  <Text style={isUser ? styles.userText : styles.assistantText}>
                    {m.content}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        {/* Indicateur de génération */}
        {sending ? (
          <View style={[styles.messageBlock, styles.assistantBlock]}>
            <View style={styles.assistantHeaderRow}>
              <View style={styles.assistantAvatar}>
                <Ionicons name="sparkles" size={11} color={playerColors.accent} />
              </View>
              <Text style={styles.assistantName}>Conseiller ProDay</Text>
            </View>
            <View style={[styles.assistantBubble, styles.loadingBubble, playerCard(PLAYER_SURFACE_TOKENS)]}>
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={playerColors.accent} />
                <Text style={styles.loadingText}>
                  Le Conseiller analyse ta demande...
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={CLUB_TOKENS.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {trainingCta ? (
          <PressableSpring
            style={styles.trainingCtaBtn}
            onPress={() => {
              joueurGamePress();
              nav.openDashboard('train_ai');
            }}
            scaleTo={0.96}
            haptic
          >
            <Ionicons name="play" size={16} color={playerColors.bg} />
            <Text style={styles.trainingCtaText}>
              Lancer cet entraînement
            </Text>
          </PressableSpring>
        ) : null}
      </ScrollView>

      {/* Composer Flottant Apple */}
      <View style={[styles.composerContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.composerCapsule}>
          <TextInput
            style={styles.composerInput}
            placeholder="Poser une question au conseiller..."
            placeholderTextColor={playerColors.textMuted}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => send(draft)}
            multiline
            maxLength={600}
            returnKeyType="send"
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              draft.trim()
                ? { backgroundColor: playerColors.accent }
                : { backgroundColor: playerColors.surfaceRaised },
            ]}
            onPress={() => send(draft)}
            disabled={!draft.trim() || sending}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Envoyer"
          >
            <Ionicons
              name="arrow-up"
              size={18}
              color={draft.trim() ? playerColors.bg : playerColors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(teamColor: string) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: playerColors.bg,
    },
    compactRoot: {
      minHeight: 320,
    },
    thread: {
      flex: 1,
    },
    threadPad: {
      paddingHorizontal: playerForm.space.lg,
      paddingTop: playerForm.space.lg,
      paddingBottom: playerForm.space.xl,
      gap: playerForm.space.lg,
    },
    emptyPad: {
      flexGrow: 1,
    },

    /* Accueil Style Apple */
    welcomeContainer: {
      paddingVertical: playerForm.space.sm,
      gap: playerForm.space.lg,
    },
    heroHeader: {
      alignItems: 'flex-start',
      gap: playerForm.space.sm,
    },
    sparkleCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: playerColors.accentSoft,
      borderWidth: 1,
      borderColor: playerColors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    welcomeTextGroup: {
      gap: 2,
    },
    greetingTitle: {
      ...playerType.title,
      color: playerColors.text,
    },
    greetingSub: {
      ...playerType.subheadline,
      color: playerColors.textMuted,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: playerForm.space.md,
      marginTop: 2,
      flexWrap: 'wrap',
    },
    liveDotWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: CLUB_TOKENS.secondary,
    },
    statusText: {
      ...playerType.caption,
      fontWeight: '700',
      color: CLUB_TOKENS.secondary,
    },
    securityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    securityText: {
      ...playerType.caption,
      color: playerColors.textDim,
    },

    /* Carte Post-Séance */
    postSessionCard: {
      padding: playerForm.cardPaddingH,
    },
    postSessionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: playerForm.space.sm,
    },
    tagBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    tagBadgeText: {
      ...playerType.micro,
      fontWeight: '800',
      color: CLUB_TOKENS.warning,
      letterSpacing: 0.5,
    },
    surMesurePill: {
      backgroundColor: playerColors.accentSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: playerForm.fieldRadius - 10,
    },
    surMesurePillText: {
      ...playerType.micro,
      fontWeight: '800',
      color: playerColors.accent,
      letterSpacing: 0.5,
    },
    cardTitle: {
      ...playerType.headline,
      color: playerColors.text,
      marginBottom: 2,
    },
    cardSub: {
      ...playerType.caption,
      color: playerColors.textMuted,
      lineHeight: 18,
      marginBottom: playerForm.space.md,
    },
    drillsRow: {
      flexDirection: 'row',
      gap: playerForm.kpiGap,
    },
    drillItemCard: {
      flex: 1,
      backgroundColor: playerColors.surfaceRaised,
      borderRadius: playerForm.fieldRadius,
      borderWidth: 1,
      borderColor: playerColors.border,
      padding: playerForm.space.sm,
      gap: 3,
    },
    drillHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    drillDuration: {
      ...playerType.micro,
      fontWeight: '800',
    },
    drillTitle: {
      ...playerType.caption,
      fontWeight: '700',
      color: playerColors.text,
    },
    drillFocus: {
      ...playerType.micro,
      color: playerColors.textDim,
    },

    /* Suggestions Thématiques */
    suggestionsContainer: {
      gap: playerForm.space.sm,
    },
    sectionHeaderTitle: {
      ...playerType.micro,
      fontWeight: '800',
      color: playerColors.textDim,
      letterSpacing: 0.5,
      marginLeft: 2,
    },
    suggestionsList: {
      gap: playerForm.space.sm,
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: playerForm.cardPaddingH,
      paddingVertical: playerForm.cardPaddingV - 2,
      gap: playerForm.space.md,
    },
    suggestionIconBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: playerColors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    suggestionTextCol: {
      flex: 1,
      minWidth: 0,
      gap: 1,
    },
    suggestionTag: {
      ...playerType.micro,
      fontWeight: '800',
      color: playerColors.accent,
      letterSpacing: 0.5,
    },
    suggestionTitle: {
      ...playerType.headline,
      color: playerColors.text,
    },
    suggestionSub: {
      ...playerType.caption,
      color: playerColors.textMuted,
    },

    /* Messages Style Apple */
    messageBlock: {
      width: '100%',
    },
    userBlock: {
      alignItems: 'flex-end',
    },
    userBubble: {
      maxWidth: '85%',
      paddingHorizontal: playerForm.space.lg,
      paddingVertical: playerForm.space.md,
      borderRadius: playerForm.fieldRadius,
      borderBottomRightRadius: 4,
      backgroundColor: playerColors.accentSoft,
      borderWidth: 1,
      borderColor: playerColors.accent,
    },
    userText: {
      ...playerType.callout,
      color: playerColors.text,
    },

    assistantBlock: {
      alignItems: 'flex-start',
      gap: 6,
    },
    assistantHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    assistantAvatar: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: playerColors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    assistantName: {
      ...playerType.caption,
      fontWeight: '700',
      color: playerColors.textMuted,
    },
    assistantBubble: {
      width: '100%',
      paddingHorizontal: playerForm.cardPaddingH,
      paddingVertical: playerForm.cardPaddingV,
      borderRadius: playerForm.cardRadius,
      borderTopLeftRadius: 4,
    },
    loadingBubble: {
      width: 'auto',
      alignSelf: 'flex-start',
    },
    assistantText: {
      ...playerType.callout,
      color: playerColors.text,
      lineHeight: 22,
    },

    /* Chargement & Erreur */
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 2,
    },
    loadingText: {
      ...playerType.caption,
      color: playerColors.textMuted,
      fontStyle: 'italic',
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: CLUB_TOKENS.dangerSoft,
      padding: playerForm.space.md,
      borderRadius: playerForm.fieldRadius,
      borderWidth: 1,
      borderColor: CLUB_TOKENS.danger,
    },
    errorText: {
      ...playerType.caption,
      color: CLUB_TOKENS.danger,
      flex: 1,
    },

    trainingCtaBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: playerForm.actionRadius,
      backgroundColor: playerColors.accent,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    trainingCtaText: {
      ...playerType.callout,
      fontWeight: '800',
      color: playerColors.bg,
    },

    /* Composer Capsule Flottante */
    composerContainer: {
      paddingHorizontal: playerForm.space.lg,
      paddingTop: playerForm.space.sm,
      backgroundColor: playerColors.bg,
    },
    composerCapsule: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: playerColors.surfaceRaised,
      borderRadius: playerForm.actionRadius,
      paddingLeft: playerForm.space.lg,
      paddingRight: 6,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: playerColors.border,
      minHeight: playerForm.actionMinHeight,
    },
    composerInput: {
      flex: 1,
      color: playerColors.text,
      ...playerType.callout,
      paddingVertical: 6,
      maxHeight: 120,
    },
    sendButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
