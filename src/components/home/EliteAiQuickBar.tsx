import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ELITE_COLORS, ELITE_RADIUS, ELITE_SPACING, useEliteResponsive } from '../../theme/prodayEliteTheme';
import { EliteCard } from '../ui/EliteCard';
import { EliteBadge } from '../ui/EliteBadge';
import { Icon } from '../ui/Icon';

interface Props {
  role?: 'player' | 'coach' | 'club' | string;
  onOpenAssistant: (prompt?: string) => void;
}

export const EliteAiQuickBar: React.FC<Props> = ({
  role = 'player',
  onOpenAssistant,
}) => {
  const { isMobile, containerStyle } = useEliteResponsive();
  const isCoach = role === 'coach';

  const suggestions = isCoach
    ? [
        { label: '🏋️ Préparer la séance de demain', prompt: 'Génère une séance d entraînement axée sur le pressing haut' },
        { label: '📊 Analyser le prochain adversaire', prompt: 'Analyse les points forts et faiblesses d une équipe en 4-3-3' },
        { label: '📢 Causerie d avant-match', prompt: 'Rédige une causerie motivante pour un match décisif de championnat' },
      ]
    : [
        { label: '⚡ Conseils pour mon poste', prompt: 'Donne-moi 3 conseils clés pour exceller à mon poste ce week-end' },
        { label: '🥗 Repas d avant-match optimal', prompt: 'Quel est le repas idéal 3 heures avant un match de football ?' },
        { label: '🎯 Améliorer mon score forme', prompt: 'Comment récupérer plus vite après une grosse séance d entraînement ?' },
      ];

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <EliteCard padding="md" style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <View style={styles.aiIconBadge}>
              <Icon name="star-four-points" size={16} color={ELITE_COLORS.aiPurple} />
            </View>
            <Text style={styles.titleText}>
              {isCoach ? 'Copilote IA Entraîneur' : 'Coach Personnel IA'}
            </Text>
          </View>
          <EliteBadge label="IA DISPONIBLE" variant="ai" size="sm" />
        </View>

        <Text style={styles.introText}>
          {isCoach
            ? 'Préparez vos séances, vos causeries et vos tactiques en quelques secondes.'
            : 'Optimisez votre forme, votre alimentation et vos performances sur le terrain.'}
        </Text>

        <View style={styles.suggestionsContainer}>
          {suggestions.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.75}
              onPress={() => onOpenAssistant(item.prompt)}
              style={styles.suggestionPill}
            >
              <Text style={styles.suggestionText} numberOfLines={1}>
                {item.label}
              </Text>
              <Icon name="chevron-forward" size={12} color={ELITE_COLORS.aiPurple} />
            </TouchableOpacity>
          ))}
        </View>
      </EliteCard>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: ELITE_SPACING.lg,
    marginVertical: ELITE_SPACING.sm,
  },
  card: {
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderColor: ELITE_COLORS.aiPurpleGlow,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ELITE_COLORS.aiPurpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ELITE_COLORS.aiPurpleGlow,
  },
  titleText: {
    color: ELITE_COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  introText: {
    color: ELITE_COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  suggestionsContainer: {
    gap: 6,
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: ELITE_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  suggestionText: {
    color: ELITE_COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    marginRight: 6,
  },
});
