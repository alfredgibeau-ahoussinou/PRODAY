import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProDayText } from '../ui/ProDayText';
import type { ProgressionObjective, ObjectiveActionKind } from '../../models/FootballProgression';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { prodayHaptics } from '../../utils/prodayHaptics';

interface ObjectiveCardProps {
  objective: ProgressionObjective;
  onExecuteAction: (actionKind: ObjectiveActionKind, targetId?: string) => void;
  onSubmitCompletion: (objectiveId: string) => void;
  isCompact?: boolean;
}

const CATEGORY_META: Record<
  ProgressionObjective['category'],
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  technical: { label: 'Technique', icon: 'football', color: '#00D2D3' },
  tactical: { label: 'Tactique', icon: 'git-network', color: '#54A0FF' },
  physical: { label: 'Physique', icon: 'fitness', color: '#FF9F43' },
  mental: { label: 'Mental', icon: 'bulb', color: '#5F27CD' },
  match_preparation: { label: 'Préparation', icon: 'shield-checkmark', color: '#10AC84' },
  reflection: { label: 'Réflexion', icon: 'book', color: '#EE5253' },
};

const STATUS_META: Record<
  ProgressionObjective['status'],
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  available: { label: 'Disponible', color: PLAYER_DARK.textMuted, icon: 'add-circle-outline' },
  active: { label: 'En cours', color: '#54A0FF', icon: 'time-outline' },
  submitted: { label: 'Soumis', color: '#10AC84', icon: 'checkmark-circle-outline' },
  awaiting_validation: { label: 'Attente Coach', color: '#FF9F43', icon: 'hourglass-outline' },
  completed: { label: 'Validé', color: '#10AC84', icon: 'checkmark-done-circle' },
  paused: { label: 'En pause', color: PLAYER_DARK.textMuted, icon: 'pause-circle-outline' },
  cancelled: { label: 'Annulé', color: '#EE5253', icon: 'close-circle-outline' },
  needs_revision: { label: 'À ajuster', color: '#FF9F43', icon: 'alert-circle-outline' },
};

const ACTION_CTA_LABEL: Record<ObjectiveActionKind, string> = {
  open_individual_program: 'Ouvrir l’exercice',
  open_tactical_role: 'Voir mon rôle tactique',
  open_video_clips: 'Analyser le clip',
  open_journal: 'Rédiger dans le carnet',
  open_mid_season_review: 'Remplir mon bilan',
  open_checklist: 'Vérifier la checklist',
  open_feedback: 'Poser une question',
  open_calendar: 'Voir le calendrier',
};

export const ObjectiveCard: React.FC<ObjectiveCardProps> = ({
  objective,
  onExecuteAction,
  onSubmitCompletion,
  isCompact = false,
}) => {
  const cat = CATEGORY_META[objective.category] || CATEGORY_META.technical;
  const stat = STATUS_META[objective.status] || STATUS_META.active;
  const isDone = objective.status === 'completed';
  const isAwaiting = objective.status === 'awaiting_validation';
  const isNeedsRevision = objective.status === 'needs_revision';

  return (
    <View style={[styles.card, isDone && styles.cardCompleted]}>
      {/* Ligne d'en-tête : catégorie, tag coach & récompense */}
      <View style={styles.topRow}>
        <View style={styles.categoryBadge}>
          <Ionicons name={cat.icon} size={12} color={cat.color} style={{ marginRight: 4 }} />
          <ProDayText variant="caption" style={[styles.categoryLabel, { color: cat.color }]}>
            {cat.label}
          </ProDayText>
        </View>

        <View style={styles.badgeRow}>
          {objective.is_coach_assigned ? (
            <View style={styles.coachBadge}>
              <Ionicons name="person" size={10} color="#FF9F43" style={{ marginRight: 3 }} />
              <ProDayText variant="caption" style={styles.coachBadgeText}>
                {objective.coach_name ? `Coach ${objective.coach_name}` : 'Assigné Coach'}
              </ProDayText>
            </View>
          ) : null}

          <View style={[styles.statusBadge, { borderColor: `${stat.color}40` }]}>
            <Ionicons name={stat.icon} size={10} color={stat.color} style={{ marginRight: 3 }} />
            <ProDayText variant="caption" style={[styles.statusText, { color: stat.color }]}>
              {stat.label}
            </ProDayText>
          </View>

          <View style={styles.xpRewardBadge}>
            <ProDayText variant="caption" style={styles.xpRewardText}>
              +{objective.xp_reward} XP
            </ProDayText>
          </View>
        </View>
      </View>

      {/* Titre et description d'action */}
      <ProDayText variant="section" style={[styles.title, isDone && styles.textCompleted]}>
        {objective.title}
      </ProDayText>

      <ProDayText variant="body" style={styles.actionDesc}>
        {objective.action_description}
      </ProDayText>

      {/* Purpose (finalité sportive) si non compact */}
      {!isCompact && objective.purpose ? (
        <View style={styles.purposeBox}>
          <ProDayText variant="caption" style={styles.purposeTitle}>
            Finalité sportive :
          </ProDayText>
          <ProDayText variant="caption" style={styles.purposeText}>
            {objective.purpose}
          </ProDayText>
        </View>
      ) : null}

      {/* Condition mesurable */}
      <View style={styles.conditionRow}>
        <Ionicons name="flag-outline" size={12} color={PLAYER_DARK.textMuted} style={{ marginRight: 5 }} />
        <ProDayText variant="caption" style={styles.conditionText} numberOfLines={2}>
          Objectif : {objective.measurable_condition}
        </ProDayText>
      </View>

      {/* Feedback coach si révision demandée */}
      {isNeedsRevision && objective.coach_feedback ? (
        <View style={styles.coachFeedbackBox}>
          <Ionicons name="alert-circle" size={14} color="#FF9F43" style={{ marginRight: 6 }} />
          <View style={{ flex: 1 }}>
            <ProDayText variant="caption" style={styles.coachFeedbackTitle}>
              Remarque du coach :
            </ProDayText>
            <ProDayText variant="caption" style={styles.coachFeedbackText}>
              {objective.coach_feedback}
            </ProDayText>
          </View>
        </View>
      ) : null}

      {/* Actions interactives */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionCtaButton}
          onPress={() => {
            prodayHaptics.selection();
            onExecuteAction(objective.action_kind, objective.action_target_id);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-forward-circle" size={14} color="#00D2D3" style={{ marginRight: 6 }} />
          <ProDayText variant="caption" style={styles.actionCtaText}>
            {ACTION_CTA_LABEL[objective.action_kind] || 'Accéder'}
          </ProDayText>
        </TouchableOpacity>

        {!isDone && !isAwaiting ? (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => {
              prodayHaptics.confirm();
              onSubmitCompletion(objective.id);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <ProDayText variant="caption" style={styles.submitButtonText}>
              {objective.requires_coach_validation ? 'Soumettre au coach' : 'Valider'}
            </ProDayText>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    padding: 14,
    marginVertical: 6,
  },
  cardCompleted: {
    opacity: 0.8,
    borderColor: 'rgba(16, 172, 132, 0.3)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryLabel: {
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 159, 67, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  coachBadgeText: {
    color: '#FF9F43',
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  xpRewardBadge: {
    backgroundColor: 'rgba(0, 210, 211, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  xpRewardText: {
    color: '#00D2D3',
    fontWeight: '800',
    fontSize: 11,
  },
  title: {
    color: PLAYER_DARK.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  textCompleted: {
    textDecorationLine: 'line-through',
    color: PLAYER_DARK.textMuted,
  },
  actionDesc: {
    color: PLAYER_DARK.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  purposeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#54A0FF',
  },
  purposeTitle: {
    color: '#54A0FF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  purposeText: {
    color: PLAYER_DARK.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  conditionText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    flex: 1,
  },
  coachFeedbackBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 159, 67, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  coachFeedbackTitle: {
    color: '#FF9F43',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  coachFeedbackText: {
    color: PLAYER_DARK.textSecondary,
    fontSize: 11,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 211, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionCtaText: {
    color: '#00D2D3',
    fontWeight: '700',
    fontSize: 11,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#003399',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
});
