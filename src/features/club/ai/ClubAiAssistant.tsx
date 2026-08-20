import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { useClubShellNav } from '../shell/ClubShellNavContext';
import { useClubTheme } from '../shell/ClubThemeContext';
import { useClubWorkspace } from '../hooks/useClubWorkspace';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubScreenHeader,
  ClubSectionCard,
  ClubText,
} from '../ui/clubUi';
import { spacing } from '../../../theme/designTokens';
import type { ClubThemeTokens } from '../theme/clubTokens';

type Msg = { id: string; role: 'user' | 'assistant'; text: string };

/**
 * Assistant IA Club — chat UI + confirmation pour actions sensibles.
 * Stub executor : jamais d’auto-mouvement de joueurs.
 */
export function ClubAiAssistant() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: '0',
      role: 'assistant',
      text: 'Je recommande, je ne décide pas. Demandez-moi un briefing, une checklist ou une suggestion d’affectation — toute action sensible demandera votre OK.',
    },
  ]);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    const lower = trimmed.toLowerCase();

    let reply =
      'Je note. Pour l’instant je fournis des recommandations structurées — exécution branchée au prochain passage.';
    if (lower.includes('brief') || lower.includes('aujourd')) {
      reply = `${ws.briefingHeadline} — ${ws.briefingSummary} Statut : ${ws.statusLabel}.`;
    } else if (lower.includes('déplac') || lower.includes('transfert') || lower.includes('bouger')) {
      reply =
        'Je peux suggérer un mouvement entre équipes, mais jamais l’appliquer sans votre confirmation explicite.';
    }

    const assistantMsg: Msg = { id: `a-${Date.now()}`, role: 'assistant', text: reply };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
  };

  const proposeSensitive = () => {
    Alert.alert(
      'Confirmer l’action sensible',
      'Suggestion : examiner l’affectation coach sur les équipes sans staff. Aucun joueur ne sera déplacé automatiquement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Voir les coachs',
          onPress: () => shellNav?.requestNav('coaches'),
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubScreenHeader
          title="Assistant IA"
          subtitle="Recommandations · confirmation obligatoire"
        />

        <ClubSectionCard title="Conversation">
          {messages.map((m) => (
            <View
              key={m.id}
              style={[styles.bubble, m.role === 'user' ? styles.user : styles.bot]}
            >
              <ClubText variant="body" style={m.role === 'user' ? { color: '#fff' } : undefined}>
                {m.text}
              </ClubText>
            </View>
          ))}
        </ClubSectionCard>

        <View style={styles.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Posez une question…"
            placeholderTextColor={tokens.muted}
            style={styles.input}
            onSubmitEditing={() => send(input)}
          />
          <PressableSpring onPress={() => send(input)} scaleTo={0.96} haptic style={styles.send}>
            <ClubText variant="caption" style={{ color: '#fff', fontWeight: '700' }}>
              Envoyer
            </ClubText>
          </PressableSpring>
        </View>

        <ClubSectionCard title="Actions proposées">
          <ClubActionRow
            icon="star-four-points"
            label="Briefing du jour"
            onPress={() => send('Donne-moi le briefing aujourd’hui')}
          />
          <ClubActionRow
            icon="warning"
            label="Action sensible (exemple)"
            hint="Demande toujours confirmation"
            onPress={proposeSensitive}
          />
        </ClubSectionCard>
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    bubble: {
      padding: spacing.md,
      borderRadius: 14,
      marginBottom: spacing.sm,
    },
    user: { backgroundColor: tokens.accent, alignSelf: 'flex-end', maxWidth: '92%' },
    bot: {
      backgroundColor: tokens.elevated,
      alignSelf: 'flex-start',
      maxWidth: '92%',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    composer: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
    input: {
      flex: 1,
      backgroundColor: tokens.surface,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: tokens.foreground,
    },
    send: {
      backgroundColor: tokens.accent,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      borderRadius: 12,
    },
  });
