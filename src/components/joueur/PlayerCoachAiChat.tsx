import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useAuth } from '../../context/AuthContext';
import {
  sendPlayerCoachMessage,
  type PlayerAiAction,
  type PlayerCoachAiMessage,
} from '../../services/playerCoachAi.service';
import { stripDashTypography } from '../../utils/stripDashTypography';
import { joueurGamePress } from '../../features/joueur/joueurSfx';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { isHomeTrainingIntent, type PlayerNavigateTab } from '../../utils/playerCoachIntent';
import { usePlayerTheme } from '../../context/PlayerThemeContext';
import { teamEventsService } from '../../services/teamEvents.service';
import { careerPreferencesService } from '../../services/careerPreferences.service';

type Bubble = PlayerCoachAiMessage & { id: string; timestamp?: string };

type PromptSuggestion = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  prompt: string;
};

export const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  {
    id: 'tactics',
    icon: 'compass-outline',
    title: 'Plan de match & Déplacements',
    subtitle: 'Placement entre les lignes, appels et orientation',
    prompt: 'Donne-moi les consignes tactiques et déplacements clés pour exceller à mon poste.',
  },
  {
    id: 'drills',
    icon: 'flash-outline',
    title: 'Créer une séance 20 min',
    subtitle: 'Drill technique et explosivité sans matériel',
    prompt: 'Génère-moi une séance d’entraînement individuel de 20 minutes intense au ballon.',
  },
  {
    id: 'weak_foot',
    icon: 'football-outline',
    title: 'Perfectionner mon pied faible',
    subtitle: 'Prises de balle, passes et frappes cadrées',
    prompt: 'Quels sont les meilleurs exercices pour progresser rapidement sur mon mauvais pied ?',
  },
  {
    id: 'recovery',
    icon: 'battery-charging-outline',
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

function navigateTab(nav: ReturnType<typeof useTabNavigationActions>, tab: PlayerNavigateTab) {
  switch (tab) {
    case 'home':
      nav.setActiveTab('home');
      break;
    case 'matchs':
      nav.setActiveTab('matchs');
      break;
    case 'feed':
      nav.setActiveTab('feed');
      break;
    case 'profil':
      nav.setActiveTab('profil');
      break;
    case 'plus':
      nav.setActiveTab('plus');
      break;
    case 'messages':
      nav.setActiveTab('messages');
      break;
    case 'train_ai':
      nav.openDashboard('train_ai');
      break;
    case 'train_coach':
      nav.openDashboard('train_coach');
      break;
    default:
      break;
  }
}

/**
 * Interface Conversationnelle Style ChatGPT / Google Gemini
 */
export function PlayerCoachAiChat({ compact = false, initialPrompt }: Props) {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const nav = useTabNavigationActions();
  const { colors: playerTheme, clubColors } = usePlayerTheme();
  const teamColor = clubColors?.primary || playerTheme.accent || '#00E676';

  const firstName = profile?.display_name?.split(' ')[0] || 'Joueur';
  const position = profile?.profile?.position || 'Attaquant';
  const clubName = profile?.profile?.club_id || 'FC ProDay';

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
      setError(e instanceof Error ? e.message : 'Connexion à Gemini indisponible.');
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
          /* Zéro-State : Écran d'accueil Style Google Gemini */
          <View style={styles.geminiWelcomeContainer}>
            <View style={styles.sparkleHeroWrap}>
              <LinearGradient
                colors={[`${teamColor}33`, 'transparent']}
                style={styles.sparkleHalo}
                pointerEvents="none"
              />
              <View style={[styles.sparkleCircle, { borderColor: `${teamColor}44` }]}>
                <Ionicons name="sparkles" size={28} color={teamColor} />
              </View>
            </View>

            <View style={styles.welcomeTextGroup}>
              <ProDayText style={styles.geminiGreeting}>
                Bonjour, {firstName}
              </ProDayText>
              <ProDayText style={styles.geminiQuestion}>
                Comment puis-je t'aider aujourd'hui ?
              </ProDayText>
            </View>

            {/* Cartes de suggestions minimalistes façon ChatGPT */}
            <View style={styles.suggestionsGrid}>
              {PROMPT_SUGGESTIONS.map((sug) => (
                <PressableSpring
                  key={sug.id}
                  onPress={() => send(sug.prompt)}
                  scaleTo={0.97}
                  haptic
                  style={styles.suggestionCard}
                >
                  <View style={styles.suggestionCardTop}>
                    <Ionicons name={sug.icon} size={18} color={teamColor} />
                    <Ionicons name="arrow-forward" size={14} color="#52525B" />
                  </View>
                  <ProDayText style={styles.suggestionTitle}>
                    {sug.title}
                  </ProDayText>
                  <ProDayText style={styles.suggestionSub} numberOfLines={2}>
                    {sug.subtitle}
                  </ProDayText>
                </PressableSpring>
              ))}
            </View>
          </View>
        ) : (
          /* Fil de discussion ChatGPT / Gemini */
          messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <View
                key={m.id}
                style={[styles.messageBlock, isUser ? styles.userBlock : styles.assistantBlock]}
              >
                {!isUser ? (
                  <View style={styles.assistantHeaderRow}>
                    <View style={[styles.assistantAvatar, { backgroundColor: `${teamColor}20` }]}>
                      <Ionicons name="sparkles" size={12} color={teamColor} />
                    </View>
                    <ProDayText style={styles.assistantName}>Gemini</ProDayText>
                  </View>
                ) : null}

                <View style={isUser ? [styles.userBubble, { backgroundColor: '#21222C' }] : styles.assistantTextWrap}>
                  <ProDayText style={isUser ? styles.userText : styles.assistantText}>
                    {m.content}
                  </ProDayText>
                </View>
              </View>
            );
          })
        )}

        {/* Indicateur de génération Gemini */}
        {sending ? (
          <View style={[styles.messageBlock, styles.assistantBlock]}>
            <View style={styles.assistantHeaderRow}>
              <View style={[styles.assistantAvatar, { backgroundColor: `${teamColor}20` }]}>
                <Ionicons name="sparkles" size={12} color={teamColor} />
              </View>
              <ProDayText style={styles.assistantName}>Gemini</ProDayText>
            </View>
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={teamColor} />
              <ProDayText style={styles.loadingText}>
                Génération en cours...
              </ProDayText>
            </View>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#F87171" />
            <ProDayText style={styles.errorText}>{error}</ProDayText>
          </View>
        ) : null}

        {trainingCta ? (
          <PressableSpring
            style={[styles.trainingCtaBtn, { backgroundColor: teamColor }]}
            onPress={() => {
              joueurGamePress();
              nav.openDashboard('train_ai');
            }}
            scaleTo={0.96}
            haptic
          >
            <Ionicons name="play" size={16} color="#000000" />
            <ProDayText style={styles.trainingCtaText}>
              Lancer cet entraînement
            </ProDayText>
          </PressableSpring>
        ) : null}
      </ScrollView>

      {/* Composer Flottant Style Gemini / ChatGPT iOS */}
      <View style={[styles.composerContainer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.composerCapsule}>
          <TextInput
            style={styles.composerInput}
            placeholder="Demande à Gemini..."
            placeholderTextColor="#71717A"
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
                ? { backgroundColor: teamColor }
                : { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
            ]}
            onPress={() => send(draft)}
            disabled={!draft.trim() || sending}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-up"
              size={18}
              color={draft.trim() ? '#000000' : '#71717A'}
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
      backgroundColor: '#000000',
    },
    compactRoot: {
      minHeight: 320,
    },
    thread: {
      flex: 1,
    },
    threadPad: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 20,
    },
    emptyPad: {
      flexGrow: 1,
      justifyContent: 'center',
    },

    /* Accueil Style Gemini */
    geminiWelcomeContainer: {
      paddingVertical: 20,
      gap: 24,
    },
    sparkleHeroWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 70,
    },
    sparkleHalo: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    sparkleCircle: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: '#111218',
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    welcomeTextGroup: {
      gap: 4,
    },
    geminiGreeting: {
      fontSize: 26,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.5,
    },
    geminiQuestion: {
      fontSize: 18,
      fontWeight: '600',
      color: '#71717A',
      letterSpacing: -0.3,
    },

    /* Grille de suggestions */
    suggestionsGrid: {
      gap: 10,
    },
    suggestionCard: {
      backgroundColor: '#0E0F15',
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      gap: 4,
    },
    suggestionCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    suggestionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    suggestionSub: {
      fontSize: 12,
      color: '#71717A',
      lineHeight: 16,
    },

    /* Messages Style ChatGPT / Gemini */
    messageBlock: {
      width: '100%',
    },
    userBlock: {
      alignItems: 'flex-end',
    },
    userBubble: {
      maxWidth: '85%',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
      borderBottomRightRadius: 4,
    },
    userText: {
      color: '#FFFFFF',
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '500',
    },

    assistantBlock: {
      alignItems: 'flex-start',
      gap: 8,
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
      alignItems: 'center',
      justifyContent: 'center',
    },
    assistantName: {
      fontSize: 12,
      fontWeight: '700',
      color: '#A1A1AA',
    },
    assistantTextWrap: {
      width: '100%',
      paddingLeft: 2,
    },
    assistantText: {
      color: '#ECECF1',
      fontSize: 15,
      lineHeight: 24,
      fontWeight: '400',
      letterSpacing: 0.1,
    },

    /* Indicateur de chargement */
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 4,
    },
    loadingText: {
      color: '#71717A',
      fontSize: 13,
      fontStyle: 'italic',
    },

    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    errorText: {
      color: '#F87171',
      fontSize: 13,
    },

    trainingCtaBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 24,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    trainingCtaText: {
      color: '#000000',
      fontWeight: '800',
      fontSize: 13,
    },

    /* Composer Capsule Flottante */
    composerContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      backgroundColor: '#000000',
    },
    composerCapsule: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#16171E',
      borderRadius: 28,
      paddingLeft: 16,
      paddingRight: 6,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      minHeight: 50,
    },
    composerInput: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 15,
      paddingVertical: 6,
      maxHeight: 120,
    },
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
