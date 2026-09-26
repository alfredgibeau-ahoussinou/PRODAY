import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProDayText } from '../ui/ProDayText';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { playerMidSeasonReviewsService } from '../../services/playerMidSeasonReviews.service';
import type {
  PlayerMidSeasonReview,
  PlayerSelfAssessment,
} from '../../models/PlayerMidSeasonReview';

interface Props {
  playerUid: string;
  playerName: string;
  clubId?: string;
  teamId?: string;
  seasonLabel?: string;
  accent?: string;
}

const COMMON_STRENGTHS = [
  'Vision du jeu & anticipation',
  'Endurance & volume de course',
  'Jeu de passe court & long',
  'Duel & impact physique',
  'Vitesse & explosivité',
  'Précision devant le but',
  'Discipline tactique',
  'Leadership & communication',
];

const COMMON_IMPROVEMENTS = [
  'Utilisation du pied faible',
  'Gestion des émotions sous pression',
  'Prise d’information avant réception',
  'Repli défensif & compensation',
  'Jeu de tête',
  'Régularité sur 90 minutes',
];

export const PlayerMidSeasonReviewPanel: React.FC<Props> = ({
  playerUid,
  playerName,
  clubId = '',
  teamId,
  seasonLabel = '2025/2026',
  accent = PLAYER_DARK.accent,
}) => {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<PlayerMidSeasonReview[]>([]);
  const [activeReview, setActiveReview] = useState<PlayerMidSeasonReview | null>(null);

  // Formulaire d'auto-évaluation
  const [isEditing, setIsEditing] = useState(false);
  const [reflections, setReflections] = useState('');
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);
  const [selectedImprovements, setSelectedImprovements] = useState<string[]>([]);
  const [ratingTechnical, setRatingTechnical] = useState<number>(7);
  const [ratingTactical, setRatingTactical] = useState<number>(7);
  const [ratingPhysical, setRatingPhysical] = useState<number>(7);
  const [ratingMental, setRatingMental] = useState<number>(7);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await playerMidSeasonReviewsService.listForPlayer(playerUid);
      setReviews(list);
      const current = list.find((r) => r.season_label === seasonLabel) ?? list[0] ?? null;
      setActiveReview(current);
      if (current) {
        setReflections(current.self_assessment.reflections);
        setSelectedStrengths(current.self_assessment.strengths);
        setSelectedImprovements(current.self_assessment.areas_to_improve);
        setRatingTechnical(current.self_assessment.self_rating_technical ?? 7);
        setRatingPhysical(current.self_assessment.self_rating_physical ?? 7);
        setRatingMental(current.self_assessment.self_rating_mental ?? 7);
      }
    } finally {
      setLoading(false);
    }
  }, [playerUid, seasonLabel]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleStrength = (s: string) => {
    prodayHaptics.selection();
    if (selectedStrengths.includes(s)) {
      setSelectedStrengths(selectedStrengths.filter((item) => item !== s));
    } else {
      setSelectedStrengths([...selectedStrengths, s]);
    }
  };

  const toggleImprovement = (i: string) => {
    prodayHaptics.selection();
    if (selectedImprovements.includes(i)) {
      setSelectedImprovements(selectedImprovements.filter((item) => item !== i));
    } else {
      setSelectedImprovements([...selectedImprovements, i]);
    }
  };

  const handleSave = async (isDraft: boolean) => {
    if (!reflections.trim() && !isDraft) {
      Alert.alert('Réflexion requise', 'Merci d’écrire quelques lignes sur ton ressenti de mi-saison.');
      return;
    }
    setSubmitting(true);
    try {
      const assessment: PlayerSelfAssessment = {
        reflections: reflections.trim(),
        strengths: selectedStrengths,
        areas_to_improve: selectedImprovements,
        self_rating_technical: ratingTechnical,
        self_rating_physical: ratingPhysical,
        self_rating_mental: ratingMental,
      };

      const saved = await playerMidSeasonReviewsService.savePlayerReview({
        club_id: clubId,
        team_id: teamId,
        player_uid: playerUid,
        player_name: playerName,
        season_label: seasonLabel,
        self_assessment: assessment,
        is_draft: isDraft,
      });

      setActiveReview(saved);
      setIsEditing(false);
      prodayHaptics.confirm();
      Alert.alert(
        isDraft ? 'Brouillon sauvegardé' : 'Bilan soumis au coach',
        isDraft
          ? 'Ton auto-évaluation est enregistrée en brouillon privé.'
          : 'Ton auto-évaluation a été transmise à ton coach pour son retour et la fixation des objectifs.',
      );
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible de sauvegarder.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={accent} />
        <ProDayText style={styles.loadingText}>Chargement du bilan de mi-saison…</ProDayText>
      </View>
    );
  }

  const isSubmitted = activeReview?.status === 'submitted_by_player' || activeReview?.status === 'completed_by_coach';
  const hasCoachReview = Boolean(activeReview?.coach_review);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Ionicons name="clipboard-outline" size={18} color={accent} />
          <ProDayText style={styles.title}>Bilan de Mi-Saison</ProDayText>
        </View>

        {activeReview ? (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  activeReview.status === 'completed_by_coach'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : activeReview.status === 'submitted_by_player'
                    ? 'rgba(76, 139, 255, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)',
              },
            ]}
          >
            <ProDayText
              style={[
                styles.statusBadgeText,
                {
                  color:
                    activeReview.status === 'completed_by_coach'
                      ? '#10B981'
                      : activeReview.status === 'submitted_by_player'
                      ? '#4C8BFF'
                      : '#F59E0B',
                },
              ]}
            >
              {activeReview.status === 'completed_by_coach'
                ? 'Revue coach finalisée'
                : activeReview.status === 'submitted_by_player'
                ? 'Soumis au staff'
                : 'Brouillon privé'}
            </ProDayText>
          </View>
        ) : null}
      </View>

      <ProDayText style={styles.subtitle}>
        Auto-évaluation structurée et échange individuel avec le coach sur ta progression et tes objectifs.
      </ProDayText>

      {/* Vue synthèse si bilan déjà soumis ou complété et qu'on n'est pas en mode édition */}
      {activeReview && !isEditing ? (
        <View style={styles.summaryWrap}>
          {/* 1. Mon Auto-évaluation */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="person-circle-outline" size={16} color={accent} />
                <ProDayText style={styles.cardTitle}>Mon Auto-évaluation</ProDayText>
              </View>
              {!hasCoachReview ? (
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <ProDayText style={[styles.editLink, { color: accent }]}>Modifier</ProDayText>
                </TouchableOpacity>
              ) : null}
            </View>

            <ProDayText style={styles.reflectionQuote}>
              "{activeReview.self_assessment.reflections || 'Aucune réflexion renseignée'}"
            </ProDayText>

            {/* Points forts */}
            <View style={styles.tagsSection}>
              <ProDayText style={styles.tagsLabel}>Points forts déclarés :</ProDayText>
              <View style={styles.chipsRow}>
                {activeReview.self_assessment.strengths.map((s) => (
                  <View key={s} style={styles.chipView}>
                    <ProDayText style={styles.chipViewText}>{s}</ProDayText>
                  </View>
                ))}
              </View>
            </View>

            {/* Axes de progrès */}
            <View style={styles.tagsSection}>
              <ProDayText style={styles.tagsLabel}>Axes de progrès prioritaires :</ProDayText>
              <View style={styles.chipsRow}>
                {activeReview.self_assessment.areas_to_improve.map((i) => (
                  <View key={i} style={[styles.chipView, styles.chipImproveView]}>
                    <ProDayText style={[styles.chipViewText, { color: '#F59E0B' }]}>{i}</ProDayText>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* 2. Observations & Objectifs du Coach (distincts) */}
          {hasCoachReview && activeReview.coach_review ? (
            <View style={[styles.card, styles.coachCard]}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                <ProDayText style={styles.cardTitle}>
                  Revue & Objectifs du Staff · {activeReview.coach_review.coach_name}
                </ProDayText>
              </View>

              <ProDayText style={styles.coachFeedbackBody}>
                {activeReview.coach_review.general_feedback}
              </ProDayText>

              {activeReview.coach_review.agreed_goals && activeReview.coach_review.agreed_goals.length > 0 ? (
                <View style={styles.goalsBox}>
                  <ProDayText style={styles.goalsTitle}>Objectifs convenus pour la fin de saison :</ProDayText>
                  {activeReview.coach_review.agreed_goals.map((g, idx) => (
                    <View key={idx} style={styles.goalItem}>
                      <Ionicons name="flag" size={12} color="#10B981" style={{ marginTop: 2 }} />
                      <ProDayText style={styles.goalText}>{g}</ProDayText>
                    </View>
                  ))}
                </View>
              ) : null}

              {activeReview.coach_review.next_review_date ? (
                <View style={styles.nextDateRow}>
                  <Ionicons name="calendar-outline" size={14} color={accent} />
                  <ProDayText style={[styles.nextDateText, { color: accent }]}>
                    Prochain point d’étape planifié : {new Date(activeReview.coach_review.next_review_date).toLocaleDateString('fr-FR')}
                  </ProDayText>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.waitingCoachCard}>
              <Ionicons name="hourglass-outline" size={20} color={PLAYER_DARK.textMuted} />
              <ProDayText style={styles.waitingText}>
                {activeReview.status === 'submitted_by_player'
                  ? 'Bilan transmis au coach. Ses observations et vos objectifs convenus apparaîtront ici.'
                  : 'Brouillon non soumis. Pense à le soumettre pour que le coach puisse préparer votre entretien.'}
              </ProDayText>
            </View>
          )}
        </View>
      ) : (
        /* Formulaire d'auto-évaluation */
        <View style={styles.formCard}>
          <ProDayText style={styles.formSectionTitle}>1. Mon ressenti sur la première partie de saison</ProDayText>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Comment juges-tu tes performances, ton implication, ta forme physique et ton intégration dans le collectif ?"
            placeholderTextColor={PLAYER_DARK.textMuted}
            value={reflections}
            onChangeText={setReflections}
          />

          <ProDayText style={styles.formSectionTitle}>2. Mes principaux points forts</ProDayText>
          <View style={styles.chipsWrap}>
            {COMMON_STRENGTHS.map((s) => {
              const isSelected = selectedStrengths.includes(s);
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.chipSelect, isSelected && { backgroundColor: `${accent}25`, borderColor: accent }]}
                  onPress={() => toggleStrength(s)}
                >
                  <ProDayText style={[styles.chipSelectText, isSelected && { color: accent, fontWeight: '700' }]}>
                    {s}
                  </ProDayText>
                </TouchableOpacity>
              );
            })}
          </View>

          <ProDayText style={styles.formSectionTitle}>3. Mes axes de progrès prioritaires</ProDayText>
          <View style={styles.chipsWrap}>
            {COMMON_IMPROVEMENTS.map((i) => {
              const isSelected = selectedImprovements.includes(i);
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.chipSelect, isSelected && { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#F59E0B' }]}
                  onPress={() => toggleImprovement(i)}
                >
                  <ProDayText style={[styles.chipSelectText, isSelected && { color: '#F59E0B', fontWeight: '700' }]}>
                    {i}
                  </ProDayText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Boutons d'action : Brouillon vs Soumission */}
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.draftBtn}
              onPress={() => handleSave(true)}
              disabled={submitting}
            >
              <ProDayText style={styles.draftBtnText}>Enregistrer brouillon</ProDayText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: accent }]}
              onPress={() => handleSave(false)}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ProDayText style={styles.submitBtnText}>Soumettre au coach</ProDayText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Historique des saisons précédentes */}
      {reviews.length > 1 && (
        <View style={styles.historyWrap}>
          <ProDayText style={styles.historyTitle}>Historique des bilans précédents</ProDayText>
          {reviews.slice(1).map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.historyItem}
              onPress={() => setActiveReview(r)}
            >
              <ProDayText style={styles.historySeasonText}>Saison {r.season_label}</ProDayText>
              <Ionicons name="chevron-forward" size={14} color={PLAYER_DARK.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
    marginBottom: 12,
    lineHeight: 16,
  },
  loadingWrap: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
  },
  summaryWrap: {
    gap: 12,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  coachCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  reflectionQuote: {
    fontSize: 13,
    color: PLAYER_DARK.text,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 10,
  },
  tagsSection: {
    marginTop: 8,
  },
  tagsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PLAYER_DARK.textMuted,
    marginBottom: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipView: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipImproveView: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  chipViewText: {
    fontSize: 11,
    color: PLAYER_DARK.text,
  },
  coachFeedbackBody: {
    fontSize: 13,
    color: PLAYER_DARK.text,
    lineHeight: 18,
    marginVertical: 8,
  },
  goalsBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
    gap: 6,
  },
  goalsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  goalText: {
    fontSize: 12,
    color: '#FFFFFF',
    flex: 1,
  },
  nextDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  nextDateText: {
    fontSize: 11,
    fontWeight: '700',
  },
  waitingCoachCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderStyle: 'dashed',
  },
  waitingText: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  formSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: PLAYER_DARK.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 8,
    marginBottom: 6,
  },
  textArea: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 10,
    color: '#FFFFFF',
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  chipSelect: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipSelectText: {
    fontSize: 11,
    color: PLAYER_DARK.text,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  draftBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  draftBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: PLAYER_DARK.textMuted,
  },
  submitBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyWrap: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: PLAYER_DARK.textMuted,
    marginBottom: 6,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  historySeasonText: {
    fontSize: 12,
    color: PLAYER_DARK.text,
  },
});
