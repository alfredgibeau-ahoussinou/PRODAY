import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { ProDayGlyph } from '../ui/prodayGlyphs';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { ELITE_COLORS, ELITE_RADIUS, ELITE_SPACING } from '../../theme/prodayEliteTheme';
import { sendPlayerCoachMessage } from '../../services/playerCoachAi.service';
import type { User } from '../../models/User';

interface Props {
  profile: User;
  nextMatchOpponent?: string;
  nextMatchDate?: string;
  accentColor?: string;
  onOpenCoachAi: (initialPrompt?: string) => void;
  onGenerateTraining?: () => void;
  onOpenMatchPlan?: () => void;
}

export const PlayerAiCopilotHero: React.FC<Props> = ({
  profile,
  nextMatchOpponent,
  nextMatchDate,
  accentColor = ELITE_COLORS.pitchGreen,
  onOpenCoachAi,
  onGenerateTraining,
  onOpenMatchPlan,
}) => {
  const [promptDraft, setPromptDraft] = useState('');
  const [briefingText, setBriefingText] = useState<string | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(true);

  const position = profile.profile?.position || 'Attaquant';
  const firstName = profile.display_name?.split(' ')[0] || 'Joueur';

  // Génération automatique du briefing IA au chargement
  useEffect(() => {
    let active = true;
    async function loadAiBriefing() {
      try {
        setLoadingBriefing(true);
        const matchContext = nextMatchOpponent
          ? `Prochain match contre ${nextMatchOpponent} (${nextMatchDate || 'ce week-end'}).`
          : 'Aucun match officiel immédiat, période de perfectionnement.';

        const response = await sendPlayerCoachMessage(
          [
            {
              role: 'user',
              content: `Génère un briefing ultra-court (2 phrases percutantes max) pour me motiver et me donner mon axe de travail du jour. Je joue ${position}. ${matchContext}`,
            },
          ],
          {
            playerName: firstName,
            position,
            clubName: profile.profile?.club_id,
          }
        );

        if (active && response.reply) {
          setBriefingText(response.reply.replace(/[-*•]/g, '').trim());
        }
      } catch {
        if (active) {
          setBriefingText(
            nextMatchOpponent
              ? `Objectif vs ${nextMatchOpponent} : Sois décisif sur tes prises de balle et fais la différence dans les 30 derniers mètres.`
              : `Aujourd'hui, perfectionne ton pied faible et maintiens ton intensité aérobie pour être prêt.`
          );
        }
      } finally {
        if (active) setLoadingBriefing(false);
      }
    }

    void loadAiBriefing();
    return () => {
      active = false;
    };
  }, [profile.uid, position, firstName, nextMatchOpponent, nextMatchDate]);

  const handleSendPrompt = () => {
    const text = promptDraft.trim();
    if (!text) return;
    prodayHaptics.press();
    setPromptDraft('');
    onOpenCoachAi(text);
  };

  return (
    <View style={styles.container}>
      {/* Halo lumineux d'ambiance */}
      <LinearGradient
        colors={[`${accentColor}18`, `${accentColor}08`, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientGlow}
        pointerEvents="none"
      />

      {/* En-tête Copilote */}
      <View style={styles.headerRow}>
        <View style={[styles.copilotBadge, { backgroundColor: `${accentColor}14`, borderColor: `${accentColor}30` }]}>
          <View style={styles.sparkleIconWrap}>
            <Ionicons name="sparkles" size={13} color={accentColor} />
          </View>
          <ProDayText style={[styles.copilotBadgeText, { color: accentColor }]}>COPILOTE IA GEMINI</ProDayText>
          <View style={[styles.livePulseDot, { backgroundColor: accentColor }]} />
        </View>

        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => {
            prodayHaptics.press();
            onOpenCoachAi();
          }}
          activeOpacity={0.7}
        >
          <ProDayText style={[styles.expandButtonText, { color: accentColor }]}>
            Ouvrir le chat
          </ProDayText>
          <Ionicons name="chevron-forward" size={14} color={accentColor} />
        </TouchableOpacity>
      </View>

      {/* Message de briefing dynamique de l'IA */}
      <View style={styles.briefingBox}>
        {loadingBriefing ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color={accentColor} />
            <ProDayText style={styles.loadingText}>
              Gemini analyse ton profil et ton calendrier...
            </ProDayText>
          </View>
        ) : (
          <ProDayText style={styles.briefingContent}>
            {briefingText}
          </ProDayText>
        )}
      </View>

      {/* Actions IA Proactives en 1 Tap (Zéro Recherche) */}
      <View style={styles.smartActionsGrid}>
        <PressableSpring
          style={[styles.actionChip, { borderColor: `${accentColor}33`, backgroundColor: `${accentColor}12` }]}
          onPress={() => {
            prodayHaptics.press();
            if (onGenerateTraining) {
              onGenerateTraining();
            } else {
              onOpenCoachAi('Génère une séance spécifique de 20 minutes pour mon poste');
            }
          }}
          scaleTo={0.96}
          haptic
        >
          <Ionicons name="flash" size={13} color={accentColor} />
          <ProDayText style={[styles.actionChipText, { color: accentColor }]}>
            Séance IA poste ({position})
          </ProDayText>
        </PressableSpring>

        {nextMatchOpponent ? (
          <PressableSpring
            style={styles.actionChip}
            onPress={() => {
              prodayHaptics.press();
              if (onOpenMatchPlan) {
                onOpenMatchPlan();
              } else {
                onOpenCoachAi(`Comment battre la défense de ${nextMatchOpponent} en tant que ${position} ?`);
              }
            }}
            scaleTo={0.96}
            haptic
          >
            <ProDayGlyph name="pitch" size={13} color={accentColor} />
            <ProDayText style={styles.actionChipText}>
              Plan tactique vs {nextMatchOpponent}
            </ProDayText>
          </PressableSpring>
        ) : (
          <PressableSpring
            style={styles.actionChip}
            onPress={() => {
              prodayHaptics.press();
              onOpenCoachAi('Quels sont les meilleurs exercices pour progresser sur mon pied faible ?');
            }}
            scaleTo={0.96}
            haptic
          >
            <Ionicons name="football" size={13} color={accentColor} />
            <ProDayText style={styles.actionChipText}>
              Perfectionner mon pied faible
            </ProDayText>
          </PressableSpring>
        )}
      </View>

      {/* Barre de Prompt Direct Intégrée (Zéro Clic d'ouverture nécessaire) */}
      <View style={styles.quickPromptBar}>
        <Ionicons name="chatbubble-ellipses-outline" size={16} color={ELITE_COLORS.titanium} />
        <TextInput
          style={styles.promptInput}
          placeholder="Demande un conseil ou un exercice à ton Coach IA..."
          placeholderTextColor={ELITE_COLORS.textMuted}
          value={promptDraft}
          onChangeText={setPromptDraft}
          onSubmitEditing={handleSendPrompt}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[
            styles.sendPromptBtn,
            { backgroundColor: promptDraft.trim() ? accentColor : ELITE_COLORS.surfaceRaised },
          ]}
          onPress={handleSendPrompt}
          disabled={!promptDraft.trim()}
          activeOpacity={0.8}

          accessibilityRole="button"
          accessibilityLabel="Envoyer">
          <Ionicons
            name="arrow-up"
            size={16}
            color={promptDraft.trim() ? '#000000' : ELITE_COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: ELITE_COLORS.surfacePrimary,
    borderRadius: ELITE_RADIUS.lg,
    padding: ELITE_SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: ELITE_SPACING.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ELITE_SPACING.sm,
  },
  copilotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: ELITE_RADIUS.pill,
    borderWidth: 1,
  },
  sparkleIconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  copilotBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  briefingBox: {
    backgroundColor: 'rgba(10, 10, 15, 0.65)',
    borderRadius: ELITE_RADIUS.md,
    padding: ELITE_SPACING.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: ELITE_SPACING.sm + 4,
    minHeight: 48,
    justifyContent: 'center',
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: ELITE_COLORS.textMuted,
    fontStyle: 'italic',
  },
  briefingContent: {
    fontSize: 13,
    lineHeight: 18,
    color: ELITE_COLORS.textPrimary,
    fontWeight: '500',
  },
  smartActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: ELITE_SPACING.sm + 4,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: ELITE_RADIUS.pill,
    backgroundColor: ELITE_COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: ELITE_COLORS.borderLight,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: ELITE_COLORS.textSecondary,
  },
  quickPromptBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ELITE_COLORS.surfaceSecondary,
    borderRadius: ELITE_RADIUS.pill,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: ELITE_COLORS.borderLight,
  },
  promptInput: {
    flex: 1,
    fontSize: 12,
    color: ELITE_COLORS.textPrimary,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  sendPromptBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
